# Auth bootstrap state machine

```text
anonymous_first_launch -- no persisted session --> signed_out --> assessment
persisted_session + network unavailable --> authenticated_offline_cached
authenticated_offline_cached + local owner workout --> workout recovery
authenticated_offline_cached + no local workout --> limited member shell
authenticated_offline_cached + reconnect --> validating_online
validating_online + valid/refreshable session --> authenticated_online --> replay
validating_online + HTTP 401 --> reauth_required
validating_online + 403/422/5xx product error --> error (never offline authority)
explicit sign out --> signed_out (owner SQLite/outbox retained and isolated)
```

Offline authorization is bounded to the `session.user.id` restored from encrypted device-only Supabase storage and that exact owner's SQLite rows. It does not mint entitlements, validate an expired token, start a new server operation, or expose another owner's data.
