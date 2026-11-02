-- App 6D-2A public delivery bucket. Upload and mutation remain server-only;
-- public means reviewed exercise assets can be cached and fetched without a
-- per-request signed URL. The catalog feature flag remains the activation gate.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-media-6d2',
  'exercise-media-6d2',
  true,
  26214400,
  array['video/mp4', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- No client INSERT/UPDATE/DELETE policy is added. Trusted server-side import
-- uses the secret/service role, while public delivery uses the bucket's public
-- object endpoint.
