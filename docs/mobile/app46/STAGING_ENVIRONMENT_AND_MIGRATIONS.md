# Staging environment and migrations

No isolated STHENO staging environment was available, so no migrations were applied outside the repository.

- Docker and Podman are absent; Supabase local development cannot start on this Windows host.
- The Supabase connector does not list a STHENO staging project.
- Listing branches for production project `svtmyxbjlbfmtysqqqwt` returned a permission error.
- Supabase preview branches incur compute charges, so App 4.6 did not create one without explicit cost approval.
- Production data and production auth users were not used for testing.

Repository migrations remain the source of truth. When an isolated environment is authorized, apply them in timestamp order and run the two-user matrix before any App 5 work.
