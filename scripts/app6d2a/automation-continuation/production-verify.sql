select jsonb_build_object(
  'tables', (
    select jsonb_agg(jsonb_build_object(
      'table', c.relname,
      'rls', c.relrowsecurity,
      'anon_select', has_table_privilege('anon', c.oid, 'select'),
      'authenticated_select', has_table_privilege('authenticated', c.oid, 'select'),
      'anon_insert', has_table_privilege('anon', c.oid, 'insert'),
      'authenticated_update', has_table_privilege('authenticated', c.oid, 'update')
    ) order by c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('exercise_media_assets','exercise_media_derivatives','exercise_media_links','exercise_media_review_events')
  ),
  'policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', tablename,
      'policy', policyname,
      'roles', roles,
      'command', cmd,
      'using', qual
    ) order by tablename, policyname), '[]'::jsonb)
    from pg_policies
    where schemaname = 'public'
      and tablename in ('exercise_media_assets','exercise_media_derivatives','exercise_media_links','exercise_media_review_events')
  ),
  'bucket', (
    select jsonb_build_object(
      'id', id,
      'public', public,
      'file_size_limit', file_size_limit,
      'allowed_mime_types', allowed_mime_types
    )
    from storage.buckets where id = 'exercise-media-6d2'
  ),
  'row_counts', jsonb_build_object(
    'assets', (select count(*) from public.exercise_media_assets),
    'derivatives', (select count(*) from public.exercise_media_derivatives),
    'links', (select count(*) from public.exercise_media_links),
    'review_events', (select count(*) from public.exercise_media_review_events),
    'active_links', (select count(*) from public.exercise_media_links where active),
    'approved_derivatives', (select count(*) from public.exercise_media_derivatives where approved),
    'storage_objects', (select count(*) from storage.objects where bucket_id = 'exercise-media-6d2')
  )
) as production_verification;
