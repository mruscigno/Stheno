-- App 6B-2 isolated evaluation ledger. Not applied to production during this sprint.
create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

create table internal.form_review_evaluation_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  budget_usd numeric(10,6) not null check (budget_usd > 0 and budget_usd <= 5),
  reserved_usd numeric(10,6) not null default 0 check (reserved_usd >= 0),
  actual_usd numeric(10,6) not null default 0 check (actual_usd >= 0),
  request_count integer not null default 0 check (request_count between 0 and 10),
  status text not null default 'open' check (status in ('open','closed','exhausted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (actual_usd + reserved_usd <= budget_usd)
);

create table internal.form_review_evaluation_requests (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references internal.form_review_evaluation_runs(id) on delete cascade,
  request_key text not null,
  model_id text not null,
  frame_count integer not null check (frame_count between 1 and 5),
  max_output_tokens integer not null check (max_output_tokens between 1 and 1200),
  reserved_usd numeric(10,6) not null check (reserved_usd > 0),
  actual_usd numeric(10,6),
  provider_response_id text,
  input_tokens integer,
  output_tokens integer,
  state text not null default 'reserved' check (state in ('reserved','reconciled','unknown','failed')),
  created_at timestamptz not null default now(),
  reconciled_at timestamptz,
  unique (run_id, request_key)
);

alter table internal.form_review_evaluation_runs enable row level security;
alter table internal.form_review_evaluation_requests enable row level security;
revoke all on all tables in schema internal from public, anon, authenticated;
grant usage on schema internal to service_role;
grant select, insert, update on internal.form_review_evaluation_runs to service_role;
grant select, insert, update on internal.form_review_evaluation_requests to service_role;

create or replace function internal.reserve_form_review_evaluation(
  requested_run_key text,
  requested_request_key text,
  requested_model_id text,
  requested_frame_count integer,
  requested_max_output_tokens integer,
  requested_reservation_usd numeric
) returns uuid
language plpgsql
security definer
set search_path = internal, pg_temp
as $$
declare target_run internal.form_review_evaluation_runs%rowtype;
declare request_id uuid;
begin
  select * into target_run from internal.form_review_evaluation_runs where run_key = requested_run_key for update;
  if not found or target_run.status <> 'open' then raise exception 'EVALUATION_RUN_CLOSED'; end if;
  if requested_frame_count not between 1 and 5 or requested_max_output_tokens not between 1 and 1200 then raise exception 'EVALUATION_REQUEST_OUT_OF_BOUNDS'; end if;
  if requested_reservation_usd <= 0 or target_run.actual_usd + target_run.reserved_usd + requested_reservation_usd > target_run.budget_usd then
    raise exception 'EVALUATION_BUDGET_EXCEEDED';
  end if;
  insert into internal.form_review_evaluation_requests(run_id,request_key,model_id,frame_count,max_output_tokens,reserved_usd)
  values(target_run.id,requested_request_key,requested_model_id,requested_frame_count,requested_max_output_tokens,requested_reservation_usd)
  returning id into request_id;
  update internal.form_review_evaluation_runs set reserved_usd=reserved_usd+requested_reservation_usd,request_count=request_count+1,updated_at=now() where id=target_run.id;
  return request_id;
end;
$$;

create or replace function internal.reconcile_form_review_evaluation(
  requested_request_id uuid,
  measured_actual_usd numeric,
  measured_provider_response_id text,
  measured_input_tokens integer,
  measured_output_tokens integer
) returns void
language plpgsql
security definer
set search_path = internal, pg_temp
as $$
declare target_request internal.form_review_evaluation_requests%rowtype;
begin
  select * into target_request from internal.form_review_evaluation_requests where id=requested_request_id for update;
  if not found or target_request.state <> 'reserved' then raise exception 'EVALUATION_REQUEST_NOT_RESERVED'; end if;
  if measured_actual_usd < 0 or measured_actual_usd > target_request.reserved_usd then raise exception 'EVALUATION_ACTUAL_COST_INVALID'; end if;
  update internal.form_review_evaluation_requests set actual_usd=measured_actual_usd,provider_response_id=measured_provider_response_id,input_tokens=measured_input_tokens,output_tokens=measured_output_tokens,state='reconciled',reconciled_at=now() where id=target_request.id;
  update internal.form_review_evaluation_runs set reserved_usd=reserved_usd-target_request.reserved_usd,actual_usd=actual_usd+measured_actual_usd,updated_at=now() where id=target_request.run_id;
end;
$$;

revoke all on function internal.reserve_form_review_evaluation(text,text,text,integer,integer,numeric) from public, anon, authenticated;
revoke all on function internal.reconcile_form_review_evaluation(uuid,numeric,text,integer,integer) from public, anon, authenticated;
grant execute on function internal.reserve_form_review_evaluation(text,text,text,integer,integer,numeric) to service_role;
grant execute on function internal.reconcile_form_review_evaluation(uuid,numeric,text,integer,integer) to service_role;
