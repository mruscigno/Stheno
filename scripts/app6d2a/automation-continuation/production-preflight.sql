select jsonb_build_object(
  'server_version', current_setting('server_version'),
  'catalog_tables', (
    select jsonb_object_agg(name, present)
    from (values
      ('exercises', to_regclass('public.exercises') is not null),
      ('exercise_media_assets', to_regclass('public.exercise_media_assets') is not null),
      ('exercise_media_derivatives', to_regclass('public.exercise_media_derivatives') is not null),
      ('exercise_media_links', to_regclass('public.exercise_media_links') is not null),
      ('exercise_media_review_events', to_regclass('public.exercise_media_review_events') is not null)
    ) as expected(name, present)
  ),
  'exercise_columns', (
    select coalesce(jsonb_agg(column_name order by ordinal_position), '[]'::jsonb)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'exercises'
  ),
  'exercise_count', (select count(*) from public.exercises),
  'storage_buckets', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id,
      'public', public,
      'file_size_limit', file_size_limit,
      'allowed_mime_types', allowed_mime_types
    ) order by id), '[]'::jsonb)
    from storage.buckets
  ),
  'latest_remote_migrations', (
    select coalesce(jsonb_agg(version order by version desc), '[]'::jsonb)
    from (select version from supabase_migrations.schema_migrations order by version desc limit 10) latest
  )
) as production_preflight;
