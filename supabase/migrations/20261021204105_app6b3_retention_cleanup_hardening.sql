-- App 6B-3 durable retention and consent-revocation cleanup.
-- Prepared for isolated validation only; no production activation is implied.
alter table public.coach_form_reviews
  add column consent_revoked_at timestamptz,
  add column cleanup_lease_token uuid,
  add column cleanup_lease_expires_at timestamptz,
  add column cleanup_attempt_count integer not null default 0 check (cleanup_attempt_count between 0 and 10),
  add column cleanup_next_attempt_at timestamptz not null default now(),
  add column cleanup_failure_reason text;

create index coach_form_reviews_cleanup_idx
  on public.coach_form_reviews(cleanup_next_attempt_at, retention_delete_at)
  where processing_status <> 'deleted';

create or replace function public.claim_expired_form_reviews(
  max_reviews integer default 100,
  lease_seconds integer default 300,
  evaluation_now timestamptz default now()
)
returns setof public.coach_form_reviews
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidates as (
    select id
    from public.coach_form_reviews
    where retention_delete_at <= evaluation_now
      and processing_status <> 'deleted'
      and cleanup_next_attempt_at <= evaluation_now
      and (cleanup_lease_expires_at is null or cleanup_lease_expires_at < evaluation_now)
    order by retention_delete_at, id
    for update skip locked
    limit greatest(0, least(max_reviews, 100))
  )
  update public.coach_form_reviews review
  set cleanup_lease_token = gen_random_uuid(),
      cleanup_lease_expires_at = evaluation_now + make_interval(secs => greatest(30, least(lease_seconds, 900))),
      updated_at = evaluation_now
  from candidates
  where review.id = candidates.id
  returning review.*;
end;
$$;

revoke all on function public.claim_expired_form_reviews(integer,integer,timestamptz) from public, anon, authenticated;
grant execute on function public.claim_expired_form_reviews(integer,integer,timestamptz) to service_role;
