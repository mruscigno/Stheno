drop index if exists public.exercise_alternatives_unique_edge;
create index if not exists exercise_alternatives_alternative_id_idx on public.exercise_alternatives(alternative_id);
