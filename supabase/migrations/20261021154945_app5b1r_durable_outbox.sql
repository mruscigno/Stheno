-- App 5B-1R: durable delivery state for the workout transactional outbox.
-- App 5A/5B-1 create the aggregate transaction and private mutation boundary.
-- This migration only adds the worker protocol and is safe to roll forward.

alter table public.workout_operation_outbox
  add column if not exists status text not null default 'pending',
  add column if not exists lease_owner uuid,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists max_attempts integer not null default 8,
  add column if not exists last_error_code text,
  add column if not exists last_error_at timestamptz,
  add column if not exists dead_lettered_at timestamptz;

alter table public.workout_operation_outbox
  drop constraint if exists workout_operation_outbox_status_check;
alter table public.workout_operation_outbox
  add constraint workout_operation_outbox_status_check
  check (status in ('pending','processing','processed','dead_letter'));
alter table public.workout_operation_outbox
  drop constraint if exists workout_operation_outbox_max_attempts_check;
alter table public.workout_operation_outbox
  add constraint workout_operation_outbox_max_attempts_check
  check (max_attempts between 1 and 32);

create index if not exists workout_operation_outbox_delivery_idx
  on public.workout_operation_outbox(status,next_attempt_at,created_at,id)
  where processed_at is null and status <> 'dead_letter';
create index if not exists workout_operation_outbox_session_order_idx
  on public.workout_operation_outbox(session_id,created_at,id)
  where processed_at is null and status <> 'dead_letter';

create table if not exists private.workout_outbox_effect_receipts (
  event_id uuid primary key references public.workout_operation_outbox(id) on delete cascade,
  consumer_version text not null,
  completed_at timestamptz not null default clock_timestamp()
);
grant usage on schema private to service_role;
revoke all on private.workout_outbox_effect_receipts from public,anon,authenticated;
grant select,insert,update,delete on private.workout_outbox_effect_receipts to service_role;

create or replace function private.assert_workout_worker()
returns void language plpgsql security invoker set search_path='' as $$
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then
    raise exception using errcode='42501',message='WORKER_AUTH_REQUIRED';
  end if;
end;$$;
revoke all on function private.assert_workout_worker() from public,anon,authenticated;
grant execute on function private.assert_workout_worker() to service_role;

create or replace function public.claim_workout_outbox(
  p_worker_id uuid,
  p_batch_size integer default 10,
  p_lease_seconds integer default 120
) returns setof public.workout_operation_outbox
language plpgsql security definer set search_path='' as $$
begin
  perform private.assert_workout_worker();
  if p_worker_id is null or p_batch_size not between 1 and 50 or p_lease_seconds not between 15 and 900 then
    raise exception using errcode='22023',message='INVALID_WORKER_ARGUMENTS';
  end if;
  return query
  with candidates as (
    select o.id
    from public.workout_operation_outbox o
    where o.processed_at is null
      and o.status <> 'dead_letter'
      and o.next_attempt_at <= clock_timestamp()
      and (o.status='pending' or o.lease_expires_at < clock_timestamp())
      and not exists (
        select 1 from public.workout_operation_outbox prior
        where prior.session_id=o.session_id
          and prior.processed_at is null
          and prior.status <> 'dead_letter'
          and (prior.created_at,prior.id) < (o.created_at,o.id)
      )
    order by o.created_at,o.id
    for update skip locked
    limit p_batch_size
  )
  update public.workout_operation_outbox o
  set status='processing',lease_owner=p_worker_id,
      lease_expires_at=clock_timestamp()+make_interval(secs=>p_lease_seconds),
      attempts=o.attempts+1
  from candidates c where o.id=c.id
  returning o.*;
end;$$;

create or replace function public.ack_workout_outbox(
  p_event_id uuid,p_worker_id uuid,p_consumer_version text
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_updated integer;
begin
  perform private.assert_workout_worker();
  insert into private.workout_outbox_effect_receipts(event_id,consumer_version)
  values(p_event_id,p_consumer_version) on conflict(event_id) do nothing;
  update public.workout_operation_outbox
  set status='processed',processed_at=coalesce(processed_at,clock_timestamp()),
      lease_owner=null,lease_expires_at=null,last_error_code=null
  where id=p_event_id and status='processing' and lease_owner=p_worker_id;
  get diagnostics v_updated=row_count;
  return v_updated=1;
end;$$;

create or replace function public.fail_workout_outbox(
  p_event_id uuid,p_worker_id uuid,p_error_code text,p_permanent boolean default false
) returns text language plpgsql security definer set search_path='' as $$
declare v_attempts integer;v_max integer;v_status text;v_delay integer;
begin
  perform private.assert_workout_worker();
  select attempts,max_attempts into v_attempts,v_max
  from public.workout_operation_outbox
  where id=p_event_id and status='processing' and lease_owner=p_worker_id for update;
  if not found then return 'lease_lost'; end if;
  if p_permanent or v_attempts>=v_max then
    v_status:='dead_letter';
    update public.workout_operation_outbox set status=v_status,dead_lettered_at=clock_timestamp(),
      lease_owner=null,lease_expires_at=null,last_error_code=left(coalesce(p_error_code,'UNKNOWN'),120),last_error_at=clock_timestamp()
    where id=p_event_id;
  else
    v_status:='pending';
    v_delay:=least(3600,(5*power(2,greatest(0,v_attempts-1)))::integer+(abs(hashtext(p_event_id::text))%7));
    update public.workout_operation_outbox set status=v_status,next_attempt_at=clock_timestamp()+make_interval(secs=>v_delay),
      lease_owner=null,lease_expires_at=null,last_error_code=left(coalesce(p_error_code,'UNKNOWN'),120),last_error_at=clock_timestamp()
    where id=p_event_id;
  end if;
  return v_status;
end;$$;

create or replace function public.redrive_workout_outbox(p_event_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_updated integer;
begin
  perform private.assert_workout_worker();
  update public.workout_operation_outbox set status='pending',attempts=0,next_attempt_at=clock_timestamp(),
    lease_owner=null,lease_expires_at=null,last_error_code=null,last_error_at=null,dead_lettered_at=null
  where id=p_event_id and status='dead_letter';
  get diagnostics v_updated=row_count;
  return v_updated=1;
end;$$;

revoke all on function public.claim_workout_outbox(uuid,integer,integer) from public,anon,authenticated;
revoke all on function public.ack_workout_outbox(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.fail_workout_outbox(uuid,uuid,text,boolean) from public,anon,authenticated;
revoke all on function public.redrive_workout_outbox(uuid) from public,anon,authenticated;
grant execute on function public.claim_workout_outbox(uuid,integer,integer) to service_role;
grant execute on function public.ack_workout_outbox(uuid,uuid,text) to service_role;
grant execute on function public.fail_workout_outbox(uuid,uuid,text,boolean) to service_role;
grant execute on function public.redrive_workout_outbox(uuid) to service_role;

comment on function public.claim_workout_outbox is 'App 5B-1R service-role-only transactional claim with session ordering and recoverable leases.';
