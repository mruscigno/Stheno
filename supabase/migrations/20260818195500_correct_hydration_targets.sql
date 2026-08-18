update public.nutrition_targets as target
set hydration_ml = round(((snapshot.profile #>> '{baseline,weightLb}')::numeric * 0.453592 * 33) / 100) * 100,
    engine_version = '1.0.1',
    ruleset_version = '2026.08.1',
    methodology_version = '2026.08.1'
from public.personalization_profile_snapshots as snapshot
where target.profile_snapshot_id = snapshot.id
  and (snapshot.profile #>> '{baseline,weightLb}') ~ '^[0-9]+([.][0-9]+)?$';
