-- Service-role configuration stays private. The explicit deny policy documents
-- that browser clients must never read provider credentials or unpublished proof.
create policy "review_provider_configs_no_client_access"
on public.review_provider_configs
for select
to authenticated
using (false);
