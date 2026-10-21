# Baseline and access

- Baseline commit: `ea5861433e5647816da0e758e310ca2d8da16330`.
- Branch: `product-13-assessment-contact-us-units-content-depth`.
- Supabase project: `svtmyxbjlbfmtysqqqwt`.
- Vercel project: `prj_B3gTxytGQTG7G3l6mzvKp1CaZJjW`.
- Production inspection was read-only through `supabase migration list --linked`, `supabase inspect db table-stats --linked`, and anonymous PostgREST schema probes.
- Supabase MCP SQL access was denied; no production DDL was attempted during discovery.
- The local host has no Docker/Podman, so real PostgreSQL rehearsal runs in the established isolated GitHub Actions lane.
- Existing untracked `artifacts/` contents were not modified or committed.
