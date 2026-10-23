# Isolated Supabase and API

The workflow boots Supabase locally, applies the current migration history, exports masked runner-local configuration, starts the real Next API, and verifies readiness. It rejects production references before startup. No secrets are committed, no paid service is enabled, and no customer data is read or written.
