create table public.anonymous_assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  capability_hash text not null unique check (char_length(capability_hash) = 64),
  schema_version text not null,
  state text not null default 'in_progress' check (state in ('in_progress','finalized','claimed','expired')),
  revision bigint not null default 0 check (revision >= 0),
  current_step_key text,
  answers jsonb not null default '{}'::jsonb,
  blueprint jsonb,
  blueprint_version text,
  expires_at timestamptz not null,
  finalized_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state <> 'claimed') or (claimed_by is not null and claimed_at is not null)),
  check ((state = 'in_progress') or blueprint is not null)
);

create index anonymous_assessment_sessions_expiry_idx on public.anonymous_assessment_sessions(expires_at);
create index anonymous_assessment_sessions_claimant_idx on public.anonymous_assessment_sessions(claimed_by) where claimed_by is not null;
alter table public.anonymous_assessment_sessions enable row level security;
revoke all on public.anonymous_assessment_sessions from public, anon, authenticated;

alter table public.assessments add column if not exists source_anonymous_session_id uuid unique references public.anonymous_assessment_sessions(id) on delete set null;

create or replace function public.claim_anonymous_assessment(
  p_session_id uuid,
  p_capability_hash text,
  p_user_id uuid,
  p_profile jsonb,
  p_provenance jsonb,
  p_safety public.safety_classification,
  p_program jsonb,
  p_validation jsonb,
  p_program_start_date date,
  p_profile_version text,
  p_engine_version text,
  p_ruleset_version text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.anonymous_assessment_sessions%rowtype;
  assessment_version_id uuid;
  assessment_id uuid;
  snapshot_id uuid;
  program_id uuid;
  prescription_id uuid;
  k text;
  v jsonb;
begin
  if p_user_id is null or p_user_id <> (select auth.uid()) then
    raise exception 'claimant_identity_mismatch' using errcode = '42501';
  end if;
  select * into s from public.anonymous_assessment_sessions
    where id = p_session_id and capability_hash = p_capability_hash for update;
  if not found then raise exception 'invalid_capability' using errcode = '42501'; end if;
  if s.expires_at <= now() then raise exception 'session_expired' using errcode = '22023'; end if;
  if s.state = 'claimed' then
    if s.claimed_by = p_user_id then
      select pp.id, pp.assessment_id, pp.profile_snapshot_id, pp.program_id
        into prescription_id, assessment_id, snapshot_id, program_id
        from public.program_prescriptions pp
        where pp.user_id = p_user_id and pp.assessment_id = (
          select a.id from public.assessments a
          where a.user_id = p_user_id and a.source_anonymous_session_id = p_session_id
        ) limit 1;
      return jsonb_build_object('claimed',true,'replayed',true,'assessmentId',assessment_id,'profileSnapshotId',snapshot_id,'programId',program_id,'prescriptionId',prescription_id);
    end if;
    raise exception 'already_claimed_by_another_account' using errcode = '42501';
  end if;
  if s.state <> 'finalized' or s.blueprint is null then raise exception 'session_not_finalized' using errcode = '22023'; end if;

  select id into assessment_version_id from public.assessment_versions where version = s.schema_version limit 1;
  if assessment_version_id is null then raise exception 'assessment_version_unavailable'; end if;
  insert into public.assessments(user_id,assessment_version_id,status,current_step_key,derivation_version,completed_at,source_anonymous_session_id)
    values(p_user_id,assessment_version_id,'completed',null,p_profile_version,now(),p_session_id) returning id into assessment_id;
  for k,v in select key,value from jsonb_each(s.answers) loop
    insert into public.assessment_responses(user_id,assessment_id,question_key,response_value,question_version,answered_at,updated_at)
      values(p_user_id,assessment_id,k,v,'1',now(),now());
  end loop;
  insert into public.personalization_profile_snapshots(user_id,assessment_id,profile_version,profile,provenance,safety_classification)
    values(p_user_id,assessment_id,p_profile_version,p_profile,p_provenance,p_safety) returning id into snapshot_id;
  insert into public.programs(user_id,name,engine_version,ruleset_version,program_start_date)
    values(p_user_id,coalesce(p_program->>'name','Your STHENO program'),p_engine_version,p_ruleset_version,p_program_start_date) returning id into program_id;
  insert into public.program_prescriptions(user_id,program_id,profile_snapshot_id,assessment_id,prescription,validation_result,engine_version,ruleset_version)
    values(p_user_id,program_id,snapshot_id,assessment_id,p_program,p_validation,p_engine_version,p_ruleset_version) returning id into prescription_id;
  update public.profiles set lifecycle_state='assessment_completed',updated_at=now() where user_id=p_user_id;
  update public.anonymous_assessment_sessions set state='claimed',claimed_by=p_user_id,claimed_at=now(),updated_at=now()
    where id=p_session_id;
  return jsonb_build_object('claimed',true,'replayed',false,'assessmentId',assessment_id,'profileSnapshotId',snapshot_id,'programId',program_id,'prescriptionId',prescription_id);
end $$;

revoke all on function public.claim_anonymous_assessment(uuid,text,uuid,jsonb,jsonb,public.safety_classification,jsonb,jsonb,date,text,text,text) from public,anon;
grant execute on function public.claim_anonymous_assessment(uuid,text,uuid,jsonb,jsonb,public.safety_classification,jsonb,jsonb,date,text,text,text) to authenticated;

comment on table public.anonymous_assessment_sessions is 'Server-only App 3 assessment state. Access requires the opaque capability through trusted API routes.';
