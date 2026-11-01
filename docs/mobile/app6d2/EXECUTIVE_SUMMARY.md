# App 6D-2 executive summary

App 6D-2 implements a reversible preferred-media architecture shared by web and native clients. It does not replace the existing 298 Vital video/poster mappings, change the 330 canonical IDs, or modify workout synchronization.

The first private batch contains 53 exact-name candidates. Multi-frame visual review accepted 52 as candidates for their existing canonical exercise and rejected one mislabeled asset (`asset-0848`, “push-up”) because it shows a chest-supported dumbbell row. No new canonical exercise was created. The 52 accepted sources were converted deterministically to H.264 MP4 plus WebP posters in private artifacts; purchased binaries are not committed.

An additive Supabase schema, flag-disabled import plan, shared API resolver, web fallback integration, and native in-app exercise guide are implemented. The new resolver falls back to the approved Vital demonstration or written guide whenever the feature is disabled, a record is unapproved, a table/query fails, a CDN base is absent, or media is withdrawn.

**Status: GO WITH BLOCKERS.** Code and private batch preparation are ready. Production schema application, asset upload, flag activation, and public media use remain off because the known production migration ledger drift has not been reconciled and a real runtime import/playback environment was not available in this sprint.
