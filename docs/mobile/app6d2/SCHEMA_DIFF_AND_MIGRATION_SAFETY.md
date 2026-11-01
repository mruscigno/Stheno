# Schema diff and migration safety

Migration `20261101143058_app6d2_media_catalog.sql` is additive and unapplied. It adds immutable source assets, derived objects, exercise links, and append-only review events. Links default inactive and all review states default pending.

Client roles have no access to source provenance or review events. Derivative and link reads require explicit grants plus RLS. Only approved derivatives and active links with approved mapping, technical, and editorial states can be read. No client write policy exists.

The schema preserves existing `exercise_media` and `exercise_media_sources` tables. Rollback is achieved by leaving the feature flag off or deactivating new links; it does not delete history.

Production inspection through the Supabase connector was unavailable due connector permission denial. The prior read-only schema export and repository migrations confirm the existing tables, but Docker/Postgres was unavailable locally, so the new DDL has not received an isolated real-Postgres execution. Because production migration history remains divergent, the migration is **NOT DEPLOYED** and blind `db push` is prohibited.
