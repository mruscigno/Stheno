-- App 6D-2A: zero-additional-cost scheduler substrate.
-- Secrets and cron jobs are operational configuration and are deliberately not
-- embedded in this migration. The production cutover stores the existing
-- CRON_SECRET and endpoint in Supabase Vault, validates a manual invocation,
-- then schedules the two jobs.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.workout_outbox_scheduler_runs (
  request_id bigint primary key,
  requested_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  status_code integer,
  timed_out boolean,
  error_message text,
  response_body jsonb,
  successful boolean generated always as (
    completed_at is not null
    and coalesce(timed_out, false) = false
    and error_message is null
    and status_code between 200 and 299
  ) stored
);

revoke all on private.workout_outbox_scheduler_runs from public, anon, authenticated;

create or replace function private.enqueue_workout_outbox_run()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  endpoint text;
  bearer text;
  v_request_id bigint;
begin
  select decrypted_secret into endpoint
  from vault.decrypted_secrets
  where name = 'workout_outbox_endpoint';

  select decrypted_secret into bearer
  from vault.decrypted_secrets
  where name = 'workout_outbox_cron_secret';

  if endpoint is null or endpoint !~ '^https://www\.sthenofitness\.com/api/cron/workout-outbox$' then
    raise exception 'WORKOUT_OUTBOX_ENDPOINT_NOT_CONFIGURED';
  end if;
  if bearer is null or length(bearer) < 16 then
    raise exception 'WORKOUT_OUTBOX_SECRET_NOT_CONFIGURED';
  end if;

  select net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || bearer,
      'User-Agent', 'STHENO-Supabase-Cron/1.0'
    ),
    body := jsonb_build_object('source', 'supabase_cron', 'requestedAt', clock_timestamp()),
    timeout_milliseconds := 290000
  ) into v_request_id;

  insert into private.workout_outbox_scheduler_runs(request_id)
  values (v_request_id)
  on conflict (request_id) do nothing;

  return v_request_id;
end;
$$;

create or replace function private.reconcile_workout_outbox_runs()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  updated_count integer;
begin
  update private.workout_outbox_scheduler_runs run
  set completed_at = response.created,
      status_code = response.status_code,
      timed_out = response.timed_out,
      error_message = response.error_msg,
      response_body = case
        when response.content is not null and response.content_type like 'application/json%'
          then response.content::jsonb
        else null
      end
  from net._http_response response
  where response.id = run.request_id
    and run.completed_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function private.enqueue_workout_outbox_run() from public, anon, authenticated;
revoke all on function private.reconcile_workout_outbox_runs() from public, anon, authenticated;
grant execute on function private.enqueue_workout_outbox_run() to postgres;
grant execute on function private.reconcile_workout_outbox_runs() to postgres;

comment on table private.workout_outbox_scheduler_runs is
  'Private pg_net request ledger for the zero-cost workout outbox scheduler. Responses remain queryable after pg_net TTL cleanup.';
