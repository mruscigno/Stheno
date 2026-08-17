create table public.methodology_versions (
 id uuid primary key default gen_random_uuid(), domain text not null, version text not null, status text not null check(status in ('draft','active','retired')), configuration jsonb not null, evidence_notes text not null, published_at timestamptz, created_at timestamptz not null default now(), unique(domain,version)
);

create table public.muscle_taxonomy (key text primary key, name text not null, anatomy_map_id text not null unique, status text not null default 'active');
create table public.equipment_taxonomy (key text primary key, name text not null, portable boolean not null default false, status text not null default 'active');
create table public.movement_patterns (key text primary key, name text not null, description text not null, status text not null default 'active');

alter table public.exercises
 add column family text,
 add column movement_pattern text references public.movement_patterns(key),
 add column exercise_role text check(exercise_role in ('primary','secondary','accessory')),
 add column primary_muscles text[] not null default '{}',
 add column secondary_muscles text[] not null default '{}',
 add column required_equipment text[] not null default '{}',
 add column skill_level text check(skill_level in ('new','beginner','intermediate','advanced')),
 add column fatigue_cost smallint check(fatigue_cost between 1 and 5),
 add column progression_suitability smallint check(progression_suitability between 1 and 5),
 add column rep_min smallint,
 add column rep_max smallint,
 add column education jsonb not null default '{}'::jsonb,
 add column caution_tags text[] not null default '{}',
 add column content_version text,
 add column license_key text,
 add column review_status text not null default 'draft' check(review_status in ('draft','reviewed'));
create index exercises_pattern_status_idx on public.exercises(movement_pattern,status);

create table public.program_prescriptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, program_id uuid not null references public.programs(id) on delete cascade, profile_snapshot_id uuid not null references public.personalization_profile_snapshots(id) on delete restrict, assessment_id uuid not null references public.assessments(id) on delete restrict, prescription jsonb not null, validation_result jsonb not null, engine_version text not null, ruleset_version text not null, prescribed_at timestamptz not null default now(), unique(program_id)
);
create index program_prescriptions_owner_time_idx on public.program_prescriptions(user_id,prescribed_at desc);
create index program_prescriptions_profile_idx on public.program_prescriptions(profile_snapshot_id);
create index program_prescriptions_assessment_idx on public.program_prescriptions(assessment_id);

create table public.exercise_replacement_decisions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, program_id uuid not null references public.programs(id) on delete cascade, original_exercise_id uuid not null references public.exercises(id), replacement_exercise_id uuid references public.exercises(id), reason text not null, scope text not null check(scope in ('session_only','program','persistent')), classification public.safety_classification not null, reason_codes text[] not null, structured_context jsonb not null default '{}'::jsonb, engine_version text not null, ruleset_version text not null, decided_at timestamptz not null default now()
);
create index exercise_replacement_decisions_owner_idx on public.exercise_replacement_decisions(user_id,decided_at desc);
create index exercise_replacement_decisions_program_idx on public.exercise_replacement_decisions(program_id);
create index exercise_replacement_decisions_original_idx on public.exercise_replacement_decisions(original_exercise_id);
create index exercise_replacement_decisions_replacement_idx on public.exercise_replacement_decisions(replacement_exercise_id);

create table public.schedule_adaptation_proposals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, program_id uuid not null references public.programs(id) on delete cascade, constraints jsonb not null, proposal jsonb not null, reason_codes text[] not null, confirmation_state text not null default 'pending' check(confirmation_state in ('pending','confirmed','rejected')), engine_version text not null, ruleset_version text not null, proposed_at timestamptz not null default now(), decided_at timestamptz
);
create index schedule_adaptation_proposals_owner_idx on public.schedule_adaptation_proposals(user_id,proposed_at desc);
create index schedule_adaptation_proposals_program_idx on public.schedule_adaptation_proposals(program_id);

do $$ declare t text; begin
 foreach t in array array['methodology_versions','muscle_taxonomy','equipment_taxonomy','movement_patterns'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy %I on public.%I for select to authenticated using (true)',t||'_read',t);
 end loop;
 foreach t in array array['program_prescriptions','exercise_replacement_decisions','schedule_adaptation_proposals'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t||'_select_own',t);
  execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t||'_insert_own',t);
 end loop;
end $$;
grant select on public.methodology_versions,public.muscle_taxonomy,public.equipment_taxonomy,public.movement_patterns to authenticated;
grant select,insert on public.program_prescriptions,public.exercise_replacement_decisions,public.schedule_adaptation_proposals to authenticated;

insert into public.muscle_taxonomy(key,name,anatomy_map_id) values
 ('quadriceps','Quadriceps','quadriceps'),('hamstrings','Hamstrings','hamstrings'),('glutes','Glutes','glutes'),('chest','Chest','pectorals'),('back','Back','back'),('shoulders','Shoulders','deltoids'),('biceps','Biceps','biceps'),('triceps','Triceps','triceps'),('calves','Calves','calves'),('core','Core','core') on conflict do nothing;
insert into public.equipment_taxonomy(key,name,portable) values
 ('barbell','Barbell',false),('dumbbells','Dumbbells',false),('machines','Resistance machines',false),('cables','Cable station',false),('bench','Bench',false),('bands','Resistance bands',true),('bodyweight','Bodyweight',true) on conflict do nothing;
insert into public.movement_patterns(key,name,description) values
 ('squat','Squat','Knee-dominant bilateral lower-body pattern'),('hinge','Hinge','Hip-dominant lower-body pattern'),('horizontal_push','Horizontal push','Pressing away from the torso horizontally'),('vertical_push','Vertical push','Pressing overhead'),('horizontal_pull','Horizontal pull','Pulling toward the torso horizontally'),('vertical_pull','Vertical pull','Pulling vertically toward the torso'),('lunge','Lunge','Split-stance or unilateral lower-body pattern'),('isolation','Isolation','Single-joint emphasis'),('carry','Carry','Loaded locomotion and bracing') on conflict do nothing;
insert into public.methodology_versions(domain,version,status,configuration,evidence_notes,published_at) values
 ('resistance_training','2026.08-v1','active','{"weeks":4,"progression":"double_progression","frequency":{"min":2,"max":5},"session_minutes":{"min":25,"max":90},"rir":{"new":3,"beginner":3,"intermediate":2,"advanced":2}}'::jsonb,'Conservative V1 ruleset for deterministic resistance-training prescriptions. Dedicated expert review remains required before broad public launch.',now()) on conflict do nothing;

insert into public.exercises(slug,name,status,family,movement_pattern,exercise_role,primary_muscles,secondary_muscles,required_equipment,skill_level,fatigue_cost,progression_suitability,rep_min,rep_max,education,content_version,license_key,review_status) values
 ('barbell-back-squat','Barbell Back Squat','production','squat','squat','primary','{quadriceps,glutes}','{core}','{barbell}','intermediate',5,5,3,12,'{"setup":["Set the bar securely and establish a stable stance."],"execution":["Descend under control and stand without losing position."],"cues":["Brace before each rep."],"mistakes":["Using load that changes the intended range."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('goblet-squat','Goblet Squat','production','squat','squat','primary','{quadriceps,glutes}','{core}','{dumbbells}','new',3,4,6,15,'{"setup":["Hold one dumbbell close to the torso."],"execution":["Squat through a controlled repeatable range."],"cues":["Keep the load close."],"mistakes":["Rushing the lowering phase."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('leg-press','Leg Press','production','squat','squat','primary','{quadriceps,glutes}','{}','{machines}','new',3,4,6,15,'{"setup":["Adjust the seat for a controlled range."],"execution":["Press without losing contact with the pad."],"cues":["Control the bottom position."],"mistakes":["Using a range you cannot control."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('split-squat','Dumbbell Split Squat','production','lunge','lunge','secondary','{quadriceps,glutes}','{}','{dumbbells}','new',3,4,6,15,'{"setup":["Establish a stable split stance."],"execution":["Lower and rise through the front leg."],"cues":["Stay balanced."],"mistakes":["Using an unstable stance."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('barbell-rdl','Barbell Romanian Deadlift','production','hinge','hinge','primary','{hamstrings,glutes}','{back}','{barbell}','intermediate',4,5,5,12,'{"setup":["Stand tall with the bar close."],"execution":["Hinge while keeping the bar close."],"cues":["Push the hips back."],"mistakes":["Turning the movement into a squat."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('dumbbell-rdl','Dumbbell Romanian Deadlift','production','hinge','hinge','primary','{hamstrings,glutes}','{}','{dumbbells}','new',3,4,6,15,'{"setup":["Hold dumbbells beside the thighs."],"execution":["Hinge through a controlled range."],"cues":["Keep the weights close."],"mistakes":["Chasing depth by rounding."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('hip-thrust','Hip Thrust','production','hip_extension','hinge','secondary','{glutes}','{hamstrings}','{barbell,bench}','new',3,4,6,15,'{"setup":["Set the upper back securely on the bench."],"execution":["Extend the hips without overextending the spine."],"cues":["Finish with the glutes."],"mistakes":["Hyperextending the low back."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('leg-curl','Leg Curl','production','knee_flexion','isolation','accessory','{hamstrings}','{}','{machines}','new',1,4,8,20,'{"setup":["Align the machine pivot with the knee."],"execution":["Curl under control."],"cues":["Keep the hips still."],"mistakes":["Using momentum."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('barbell-bench-press','Barbell Bench Press','production','bench_press','horizontal_push','primary','{chest}','{shoulders,triceps}','{barbell,bench}','intermediate',4,5,3,12,'{"setup":["Set a stable five-point position."],"execution":["Lower to a repeatable touch point and press."],"cues":["Keep the upper back set."],"mistakes":["Losing bar control."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('dumbbell-bench-press','Dumbbell Bench Press','production','bench_press','horizontal_push','primary','{chest}','{shoulders,triceps}','{dumbbells,bench}','new',3,4,6,15,'{"setup":["Set the dumbbells safely from the thighs."],"execution":["Press through a controlled path."],"cues":["Keep wrists stacked."],"mistakes":["Dropping too deep without control."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('push-up','Push-Up','production','push_up','horizontal_push','primary','{chest}','{shoulders,triceps,core}','{bodyweight}','new',2,4,6,25,'{"setup":["Set a rigid plank position."],"execution":["Lower and press as one unit."],"cues":["Keep ribs and pelvis controlled."],"mistakes":["Letting the hips sag."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('dumbbell-overhead-press','Dumbbell Overhead Press','production','overhead_press','vertical_push','secondary','{shoulders}','{triceps}','{dumbbells}','new',3,4,6,15,'{"setup":["Brace with dumbbells at shoulder level."],"execution":["Press overhead through a controlled path."],"cues":["Keep the torso quiet."],"mistakes":["Excessive back extension."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('cable-row','Seated Cable Row','production','row','horizontal_pull','primary','{back}','{biceps}','{cables}','new',2,4,6,15,'{"setup":["Set a stable seated position."],"execution":["Pull toward the torso without rocking."],"cues":["Drive elbows back."],"mistakes":["Using torso momentum."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('one-arm-dumbbell-row','One-Arm Dumbbell Row','production','row','horizontal_pull','primary','{back}','{biceps}','{dumbbells}','new',3,4,6,15,'{"setup":["Brace against a stable support."],"execution":["Row without rotating the torso."],"cues":["Pull the elbow toward the hip."],"mistakes":["Twisting for extra range."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('lat-pulldown','Lat Pulldown','production','vertical_pull','vertical_pull','primary','{back}','{biceps}','{cables}','new',2,4,6,15,'{"setup":["Secure the thighs under the pad."],"execution":["Pull toward the upper chest under control."],"cues":["Drive elbows down."],"mistakes":["Leaning back excessively."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('pull-up','Pull-Up','production','vertical_pull','vertical_pull','primary','{back}','{biceps}','{bodyweight}','intermediate',3,4,3,15,'{"setup":["Take a secure grip and stable hang."],"execution":["Pull without swinging."],"cues":["Drive elbows down."],"mistakes":["Kipping unintentionally."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('lateral-raise','Dumbbell Lateral Raise','production','lateral_raise','isolation','accessory','{shoulders}','{}','{dumbbells}','new',1,4,10,25,'{"setup":["Stand stable with light dumbbells."],"execution":["Raise under control."],"cues":["Lead with the elbows."],"mistakes":["Swinging heavy weight."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('dumbbell-curl','Dumbbell Curl','production','elbow_flexion','isolation','accessory','{biceps}','{}','{dumbbells}','new',1,4,8,20,'{"setup":["Stand with arms controlled at the sides."],"execution":["Curl without moving the upper arm."],"cues":["Keep elbows quiet."],"mistakes":["Swinging the torso."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('cable-triceps-pressdown','Cable Triceps Pressdown','production','elbow_extension','isolation','accessory','{triceps}','{}','{cables}','new',1,4,8,20,'{"setup":["Set elbows near the torso."],"execution":["Extend without moving the shoulders."],"cues":["Finish with the triceps."],"mistakes":["Turning it into a bodyweight press."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed'),
 ('standing-calf-raise','Standing Calf Raise','production','calf_raise','isolation','accessory','{calves}','{}','{bodyweight}','new',1,4,10,25,'{"setup":["Use stable support if needed."],"execution":["Rise and lower through a controlled range."],"cues":["Pause at the top."],"mistakes":["Bouncing through reps."]}'::jsonb,'1.0.0','STHENO_ORIGINAL','reviewed')
on conflict(slug) do update set status=excluded.status,family=excluded.family,movement_pattern=excluded.movement_pattern,exercise_role=excluded.exercise_role,primary_muscles=excluded.primary_muscles,secondary_muscles=excluded.secondary_muscles,required_equipment=excluded.required_equipment,skill_level=excluded.skill_level,fatigue_cost=excluded.fatigue_cost,progression_suitability=excluded.progression_suitability,rep_min=excluded.rep_min,rep_max=excluded.rep_max,education=excluded.education,content_version=excluded.content_version,license_key=excluded.license_key,review_status=excluded.review_status;
