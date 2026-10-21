# Security and two-user results

The isolated CI workflow applies every migration to an ephemeral local Supabase stack and runs:

- the existing 24-assertion App 4.7 two-user suite;
- the 13-assertion App 6B-1 private-review suite;
- the 8-assertion App 6B-2 budget suite;
- the 12-assertion App 6B-3 cleanup suite;
- the concurrent anonymous-assessment claim race.

App 6B-3 adds service-role-only retention claims, leased `SKIP LOCKED` selection, duplicate-claim denial, explicit consent revocation, and durable cleanup retry state. Production migration status: **not applied**.

GitHub Actions run `39673419709` passed on an isolated ephemeral Supabase stack:

- App 4.7: 24/24;
- App 6B-1: 13/13;
- App 6B-2: 8/8;
- App 6B-3: 12/12;
- concurrent A/B claim race: passed.

Total pgTAP assertions: **57/57**. Production was not connected or modified.
