-- App 6B-1 durable form-review worker state. Depends on the App 6B base migration.
alter table public.coach_form_reviews
  add column lease_token uuid,
  add column lease_expires_at timestamptz,
  add column next_attempt_at timestamptz not null default now(),
  add column processing_version text,
  add column frame_count integer not null default 0 check (frame_count between 0 and 12),
  add column model_input_tokens integer not null default 0 check (model_input_tokens >= 0),
  add column model_output_tokens integer not null default 0 check (model_output_tokens >= 0);

alter table public.coach_form_reviews drop constraint coach_form_reviews_processing_status_check;
alter table public.coach_form_reviews add constraint coach_form_reviews_processing_status_check
  check (processing_status in ('uploading','queued','processing','completed','abstained','failed','deleted','expired'));

create or replace function public.claim_form_review_jobs(max_jobs integer default 2, lease_seconds integer default 240)
returns setof public.coach_form_reviews
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidates as (
    select id from public.coach_form_reviews
    where processing_status = 'queued'
      and next_attempt_at <= now()
      and (lease_expires_at is null or lease_expires_at < now())
      and deleted_at is null
    order by created_at
    for update skip locked
    limit greatest(0, least(max_jobs, 5))
  )
  update public.coach_form_reviews r
  set processing_status = 'processing',
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => greatest(30, least(lease_seconds, 600))),
      claimed_at = now(),
      updated_at = now()
  from candidates c
  where r.id = c.id
  returning r.*;
end;
$$;
revoke all on function public.claim_form_review_jobs(integer,integer) from public, anon, authenticated;
grant execute on function public.claim_form_review_jobs(integer,integer) to service_role;

create or replace function public.enforce_form_review_monthly_quota()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare existing_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || to_char(now() at time zone 'utc','YYYY-MM'), 0));
  select count(*) into existing_count from public.coach_form_reviews
    where user_id = new.user_id
      and created_at >= date_trunc('month', now() at time zone 'utc')
      and processing_status not in ('deleted','failed','expired');
  if existing_count >= 4 then raise exception 'FORM_REVIEW_MONTHLY_QUOTA_REACHED' using errcode='P0001'; end if;
  return new;
end;
$$;
create trigger coach_form_reviews_monthly_quota before insert on public.coach_form_reviews
for each row execute function public.enforce_form_review_monthly_quota();
