# Zero-cost staging architecture

App 4.7 uses an ephemeral Supabase stack started inside GitHub Actions. It is isolated by design:

- local project id: `stheno-app47-local`;
- production project ref `svtmyxbjlbfmtysqqqwt` is explicitly rejected;
- production-shaped Supabase credentials are rejected from the job environment;
- every run starts from migrations, creates synthetic fixtures, runs tests, uploads short-lived evidence, and is destroyed with the runner;
- no paid Supabase preview branch, additional compute instance, or billing upgrade is used.

This lane is suitable for migration and security validation. It is intentionally not exposed as a durable public staging backend.

