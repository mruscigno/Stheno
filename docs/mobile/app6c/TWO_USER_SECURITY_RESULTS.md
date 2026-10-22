# Two-user security results

The App 6C pgTAP suite adds explicit A/B ownership and cross-user decision tests to the existing App 4.7 isolation matrix. GitHub Actions run `39806733118` passed the complete isolated Supabase matrix: migrations, App 6C tests, prior security suites, and concurrent A/B claim race.

Local execution was unavailable because Docker and Podman are absent, so CI supplied the required isolated-container evidence before production migration.
