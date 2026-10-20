-- App 5B-1: keep the privileged implementation out of the exposed schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text)
  set schema private;
revoke all on function private.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text) from public, anon;
grant execute on function private.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text) to authenticated;

create function public.apply_workout_operation(
  p_operation_id uuid,
  p_session_id uuid,
  p_kind text,
  p_base_revision bigint,
  p_schema_version integer,
  p_client_created_at timestamptz,
  p_payload jsonb,
  p_payload_hash text
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.apply_workout_operation(
    p_operation_id,p_session_id,p_kind,p_base_revision,p_schema_version,
    p_client_created_at,p_payload,p_payload_hash
  );
$$;
revoke all on function public.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text) from public, anon;
grant execute on function public.apply_workout_operation(uuid,uuid,text,bigint,integer,timestamptz,jsonb,text) to authenticated;

create function public.get_workout_operation_receipt(p_operation_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'operationId', r.operation_id,
    'sessionId', r.session_id,
    'kind', r.operation_kind,
    'revision', r.resulting_revision,
    'serverTimestamp', r.committed_at,
    'receiptState', r.receipt_state,
    'replayed', true,
    'result', r.result
  )
  from public.workout_operation_receipts r
  where r.user_id=(select auth.uid()) and r.operation_id=p_operation_id;
$$;
revoke all on function public.get_workout_operation_receipt(uuid) from public, anon;
grant execute on function public.get_workout_operation_receipt(uuid) to authenticated;

comment on function public.apply_workout_operation is
  'Authenticated Data API adapter; privileged transaction implementation lives in private schema.';

alter table public.workout_operation_receipts drop constraint workout_operation_receipts_operation_kind_check;
alter table public.workout_operation_receipts add constraint workout_operation_receipts_operation_kind_check
  check (operation_kind in ('start_session','upsert_set','delete_set','save_note','complete_session','substitute_exercise','adapt_session'));

create function private.apply_workout_adaptation(
 p_operation_id uuid,p_session_id uuid,p_base_revision bigint,p_schema_version integer,
 p_client_created_at timestamptz,p_payload jsonb,p_payload_hash text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_receipt public.workout_operation_receipts%rowtype;
 v_session public.workout_execution_sessions%rowtype;v_now timestamptz:=clock_timestamp();v_revision bigint;v_result jsonb;
begin
 if v_user is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if p_schema_version<>1 or p_payload_hash!~'^[a-f0-9]{64}$' then raise exception using errcode='22023',message='INVALID_OPERATION_ENVELOPE'; end if;
 select * into v_receipt from public.workout_operation_receipts where user_id=v_user and operation_id=p_operation_id;
 if found then
  if v_receipt.payload_hash<>p_payload_hash then raise exception using errcode='P0001',message='IDEMPOTENCY_CONFLICT'; end if;
  return jsonb_build_object('operationId',p_operation_id,'sessionId',v_receipt.session_id,'revision',v_receipt.resulting_revision,'serverTimestamp',v_receipt.committed_at,'receiptState','committed','replayed',true,'result',v_receipt.result);
 end if;
 select * into v_session from public.workout_execution_sessions where id=p_session_id and user_id=v_user and deleted_at is null for update;
 if not found then raise exception using errcode='P0002',message='WORKOUT_NOT_FOUND'; end if;
 if v_session.status='completed' then raise exception using errcode='P0001',message='WORKOUT_ALREADY_COMPLETED'; end if;
 if p_base_revision is null or p_base_revision<>v_session.revision then raise exception using errcode='P0001',message='STALE_REVISION',detail=jsonb_build_object('expectedRevision',v_session.revision,'receivedRevision',p_base_revision)::text; end if;
 update public.workout_execution_sessions set revised_workout=p_payload->'revisedWorkout',revision=revision+1,updated_at=v_now where id=p_session_id returning revision into v_revision;
 insert into public.workout_session_adaptations(user_id,workout_execution_session_id,adaptation_type,reason,scope,original_state,revised_state,reason_codes,safety_classification,engine_version,ruleset_version)
 values(v_user,p_session_id,p_payload->>'adaptationType',p_payload->>'reason',coalesce(p_payload->>'scope','session_only'),coalesce(v_session.revised_workout,v_session.original_workout),p_payload->'revisedWorkout',coalesce(array(select jsonb_array_elements_text(p_payload->'reasonCodes')),array[]::text[]),'normal','app5b1','app5b1');
 v_result:=jsonb_build_object('state','adapted','workout',p_payload->'revisedWorkout','reasonCodes',p_payload->'reasonCodes');
 insert into public.workout_operation_receipts(user_id,operation_id,session_id,operation_kind,schema_version,payload_hash,base_revision,resulting_revision,result,client_created_at,committed_at)
 values(v_user,p_operation_id,p_session_id,'adapt_session',p_schema_version,p_payload_hash,p_base_revision,v_revision,v_result,p_client_created_at,v_now);
 insert into public.workout_operation_outbox(user_id,operation_id,session_id,event_type,payload) values(v_user,p_operation_id,p_session_id,'workout.adapt_session',v_result);
 return jsonb_build_object('operationId',p_operation_id,'sessionId',p_session_id,'revision',v_revision,'serverTimestamp',v_now,'receiptState','committed','replayed',false,'result',v_result);
end;$$;
revoke all on function private.apply_workout_adaptation(uuid,uuid,bigint,integer,timestamptz,jsonb,text) from public,anon;
grant execute on function private.apply_workout_adaptation(uuid,uuid,bigint,integer,timestamptz,jsonb,text) to authenticated;
create function public.apply_workout_adaptation(p_operation_id uuid,p_session_id uuid,p_base_revision bigint,p_schema_version integer,p_client_created_at timestamptz,p_payload jsonb,p_payload_hash text)
returns jsonb language sql security invoker set search_path='' as $$select private.apply_workout_adaptation(p_operation_id,p_session_id,p_base_revision,p_schema_version,p_client_created_at,p_payload,p_payload_hash);$$;
revoke all on function public.apply_workout_adaptation(uuid,uuid,bigint,integer,timestamptz,jsonb,text) from public,anon;
grant execute on function public.apply_workout_adaptation(uuid,uuid,bigint,integer,timestamptz,jsonb,text) to authenticated;
