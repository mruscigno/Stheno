-- App 5A: one transactional boundary for offline/replayed workout mutations.
alter table public.workout_execution_sessions
  add column if not exists revision bigint not null default 0 check (revision >= 0),
  add column if not exists session_note text,
  add column if not exists deleted_at timestamptz;

alter table public.workout_set_logs
  add column if not exists revision bigint not null default 0 check (revision >= 0),
  add column if not exists deleted_at timestamptz;

create table public.workout_operation_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  session_id uuid,
  operation_kind text not null check (operation_kind in ('start_session','upsert_set','delete_set','save_note','complete_session','substitute_exercise')),
  schema_version integer not null check (schema_version between 1 and 10),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  base_revision bigint,
  resulting_revision bigint not null,
  receipt_state text not null default 'committed' check (receipt_state = 'committed'),
  result jsonb not null,
  client_created_at timestamptz,
  committed_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (now() + interval '180 days'),
  unique (user_id, operation_id)
);
create index workout_operation_receipts_expiry_idx on public.workout_operation_receipts(expires_at);
create index workout_operation_receipts_session_idx on public.workout_operation_receipts(user_id, session_id, committed_at desc);

create table public.workout_operation_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  session_id uuid not null references public.workout_execution_sessions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0,
  unique (user_id, operation_id, event_type)
);
create index workout_operation_outbox_pending_idx on public.workout_operation_outbox(created_at) where processed_at is null;

alter table public.workout_operation_receipts enable row level security;
alter table public.workout_operation_outbox enable row level security;
revoke all on public.workout_operation_receipts, public.workout_operation_outbox from anon, authenticated;
grant select on public.workout_operation_receipts to authenticated;
create policy "workout receipts select own" on public.workout_operation_receipts
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.apply_workout_operation(
  p_operation_id uuid,
  p_session_id uuid,
  p_kind text,
  p_base_revision bigint,
  p_schema_version integer,
  p_client_created_at timestamptz,
  p_payload jsonb,
  p_payload_hash text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_receipt public.workout_operation_receipts%rowtype;
  v_session public.workout_execution_sessions%rowtype;
  v_set public.workout_set_logs%rowtype;
  v_now timestamptz := clock_timestamp();
  v_result jsonb;
  v_revision bigint;
  v_set_id uuid;
begin
  if v_user is null then raise exception using errcode='42501', message='AUTH_REQUIRED'; end if;
  if p_kind not in ('start_session','upsert_set','delete_set','save_note','complete_session','substitute_exercise') then
    raise exception using errcode='22023', message='UNSUPPORTED_OPERATION_KIND';
  end if;
  if p_schema_version <> 1 or p_payload_hash !~ '^[a-f0-9]{64}$' then
    raise exception using errcode='22023', message='INVALID_OPERATION_ENVELOPE';
  end if;

  select * into v_receipt from public.workout_operation_receipts
   where user_id=v_user and operation_id=p_operation_id;
  if found then
    if v_receipt.payload_hash <> p_payload_hash then
      raise exception using errcode='P0001', message='IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object('operationId',p_operation_id,'sessionId',v_receipt.session_id,
      'revision',v_receipt.resulting_revision,'serverTimestamp',v_receipt.committed_at,
      'receiptState',v_receipt.receipt_state,'replayed',true,'result',v_receipt.result);
  end if;

  if p_kind = 'start_session' then
    insert into public.workout_execution_sessions
      (id,user_id,program_prescription_id,workout_key,status,original_workout,client_session_key,revision,started_at,updated_at)
    values (p_session_id,v_user,(p_payload->>'programPrescriptionId')::uuid,p_payload->>'workoutKey','active',
      p_payload->'workout',(p_payload->>'clientSessionKey')::uuid,1,coalesce(p_client_created_at,v_now),v_now)
    on conflict (user_id,client_session_key) do nothing returning * into v_session;
    if not found then
      select * into v_session from public.workout_execution_sessions
       where user_id=v_user and client_session_key=(p_payload->>'clientSessionKey')::uuid for update;
    end if;
  else
    select * into v_session from public.workout_execution_sessions
      where id=p_session_id and user_id=v_user and deleted_at is null for update;
    if not found then raise exception using errcode='P0002', message='WORKOUT_NOT_FOUND'; end if;
    if p_base_revision is null or p_base_revision <> v_session.revision then
      raise exception using errcode='P0001', message='STALE_REVISION',
        detail=jsonb_build_object('expectedRevision',v_session.revision,'receivedRevision',p_base_revision)::text;
    end if;
    if v_session.status='completed' then raise exception using errcode='P0001', message='WORKOUT_ALREADY_COMPLETED'; end if;

    if p_kind = 'upsert_set' then
      v_set_id := (p_payload->>'setId')::uuid;
      if exists(select 1 from public.workout_set_logs where id=v_set_id and user_id=v_user and deleted_at is not null) then
        raise exception using errcode='P0001', message='TOMBSTONE_CONFLICT';
      end if;
      if not exists (
        select 1 from jsonb_array_elements(coalesce(v_session.revised_workout,v_session.original_workout)->'exercises') e
        where e->>'exerciseSlug'=p_payload->>'exerciseSlug'
      ) then raise exception using errcode='P0002', message='EXERCISE_NOT_FOUND'; end if;
      insert into public.workout_set_logs
        (id,user_id,workout_execution_session_id,exercise_slug,set_ordinal,set_type,prescribed,
         load_value,load_unit,repetitions,rir,rpe,state,performed_at,client_performed_at,idempotency_key,revision,updated_at,deleted_at)
      values (v_set_id,v_user,p_session_id,p_payload->>'exerciseSlug',(p_payload->>'setOrdinal')::smallint,
        coalesce(p_payload->>'setType','working'),coalesce(p_payload->'prescribed','{}'::jsonb),
        (p_payload->>'load')::numeric,coalesce(p_payload->>'loadUnit','lb'),(p_payload->>'repetitions')::smallint,
        (p_payload->>'rir')::numeric,(p_payload->>'rpe')::numeric,p_payload->>'state',
        coalesce(p_client_created_at,v_now),p_client_created_at,p_operation_id,1,v_now,null)
      on conflict (id) do update set
        exercise_slug=excluded.exercise_slug,set_ordinal=excluded.set_ordinal,set_type=excluded.set_type,
        prescribed=excluded.prescribed,load_value=excluded.load_value,load_unit=excluded.load_unit,
        repetitions=excluded.repetitions,rir=excluded.rir,rpe=excluded.rpe,state=excluded.state,
        client_performed_at=excluded.client_performed_at,updated_at=v_now,deleted_at=null,
        idempotency_key=p_operation_id,revision=public.workout_set_logs.revision+1
      where public.workout_set_logs.user_id=v_user and public.workout_set_logs.workout_execution_session_id=p_session_id
      returning * into v_set;
      if not found then raise exception using errcode='42501', message='SET_OWNERSHIP_CONFLICT'; end if;
      v_result := jsonb_build_object('state','saved','set',to_jsonb(v_set));
    elsif p_kind = 'delete_set' then
      update public.workout_set_logs set deleted_at=v_now,updated_at=v_now,revision=revision+1
       where id=(p_payload->>'setId')::uuid and user_id=v_user and workout_execution_session_id=p_session_id and deleted_at is null
       returning * into v_set;
      v_result := jsonb_build_object('state','deleted','setId',p_payload->>'setId','tombstone',to_jsonb(v_set));
    elsif p_kind = 'save_note' then
      update public.workout_execution_sessions set session_note=nullif(p_payload->>'note','') where id=p_session_id;
      v_result := jsonb_build_object('state','saved','note',p_payload->>'note');
    elsif p_kind = 'substitute_exercise' then
      update public.workout_execution_sessions set revised_workout=p_payload->'revisedWorkout' where id=p_session_id;
      insert into public.workout_session_adaptations
        (user_id,workout_execution_session_id,adaptation_type,reason,scope,original_state,revised_state,reason_codes,safety_classification,engine_version,ruleset_version)
      values(v_user,p_session_id,'exercise_replacement',p_payload->>'reason',coalesce(p_payload->>'scope','session_only'),
        v_session.original_workout,p_payload->'revisedWorkout',coalesce(array(select jsonb_array_elements_text(p_payload->'reasonCodes')),array[]::text[]),
        coalesce((p_payload->>'safetyClassification')::public.safety_classification,'normal'),'app5a','app5a');
      v_result := jsonb_build_object('state','substituted','revisedWorkout',p_payload->'revisedWorkout');
    else
      if not coalesce((p_payload->>'allowIncomplete')::boolean,false) and
        (select count(*) from public.workout_set_logs where user_id=v_user and workout_execution_session_id=p_session_id and state='completed' and set_type<>'warmup' and deleted_at is null)
        < coalesce((select sum((e->>'sets')::integer) from jsonb_array_elements(coalesce(v_session.revised_workout,v_session.original_workout)->'exercises') e),0)
      then raise exception using errcode='P0001', message='CONFIRMATION_REQUIRED'; end if;
      update public.workout_execution_sessions set status='completed',completed_at=v_now,
        session_effort=p_payload->>'effort',completion_notes=nullif(p_payload->>'note',''),
        completion_summary=p_payload->'summary',completion_summary_version=coalesce(p_payload->>'summaryVersion','app5a')
       where id=p_session_id;
      v_result := jsonb_build_object('state','completed','summary',coalesce(p_payload->'summary',jsonb_build_object(
        'version','app5a','durationSeconds',greatest(0,extract(epoch from (v_now-v_session.started_at))::integer),
        'completedSets',(select count(*) from public.workout_set_logs where user_id=v_user and workout_execution_session_id=p_session_id and state='completed' and deleted_at is null)
      )));
    end if;
    update public.workout_execution_sessions set revision=revision+1,updated_at=v_now where id=p_session_id returning revision into v_revision;
    v_session.revision := v_revision;
  end if;

  v_revision := coalesce(v_session.revision,1);
  if v_result is null then v_result := jsonb_build_object('state','active','sessionId',v_session.id); end if;
  insert into public.workout_operation_receipts
    (user_id,operation_id,session_id,operation_kind,schema_version,payload_hash,base_revision,resulting_revision,result,client_created_at,committed_at)
  values(v_user,p_operation_id,v_session.id,p_kind,p_schema_version,p_payload_hash,p_base_revision,v_revision,v_result,p_client_created_at,v_now);
  insert into public.workout_operation_outbox(user_id,operation_id,session_id,event_type,payload)
  values(v_user,p_operation_id,v_session.id,'workout.'||p_kind,v_result);

  if coalesce(p_payload->>'testFailurePoint','')='before_commit' then
    raise exception using errcode='P0001', message='INJECTED_BEFORE_COMMIT_FAILURE';
  end if;
  return jsonb_build_object('operationId',p_operation_id,'sessionId',v_session.id,'revision',v_revision,
    'serverTimestamp',v_now,'receiptState','committed','replayed',false,'result',v_result);
exception when unique_violation then
  select * into v_receipt from public.workout_operation_receipts where user_id=v_user and operation_id=p_operation_id;
  if found and v_receipt.payload_hash=p_payload_hash then
    return jsonb_build_object('operationId',p_operation_id,'sessionId',v_receipt.session_id,
      'revision',v_receipt.resulting_revision,'serverTimestamp',v_receipt.committed_at,
      'receiptState',v_receipt.receipt_state,'replayed',true,'result',v_receipt.result);
  end if;
  raise exception using errcode='P0001', message='IDEMPOTENCY_CONFLICT';
end;
$$;

revoke all on function public.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text) from public, anon;
grant execute on function public.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text) to authenticated;
comment on function public.apply_workout_operation is 'App 5A atomic, revision-checked, replay-safe workout mutation boundary.';
