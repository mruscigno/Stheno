# Staging isolation report

Validation uses the existing zero-cost local Supabase project ID `stheno-app47-local`. CI asserts that it differs from production ref `svtmyxbjlbfmtysqqqwt` and rejects production-shaped Supabase credentials. No production customer data is copied. Local Windows execution is unavailable because Docker/Podman is not installed; the GitHub runner supplies the ephemeral database.
