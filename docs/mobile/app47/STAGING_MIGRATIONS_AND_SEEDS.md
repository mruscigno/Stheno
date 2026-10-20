# Staging migrations and seeds

`supabase start` applies the repository migration chain to a fresh ephemeral database. `supabase/seed.sql` is intentionally empty: reusable accounts or production-like personal data are not persisted.

Synthetic users, programs, workouts, reviews, storage metadata, anonymous sessions, claims, and entitlement probes are created inside transactional pgTAP tests and rolled back. The concurrent claim scripts create their own synthetic fixture and verify that only one account can win the claim race.

Migration hashes and the local service status are uploaded as 14-day CI evidence.

