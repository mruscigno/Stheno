# Authentication security report

- Public client configuration is limited to API base URL, Supabase URL, and an `sb_publishable_` key.
- Native sessions persist through Expo SecureStore using device-only, unlocked keychain/Keystore accessibility.
- Large Supabase session payloads are split into bounded chunks; deletion clears every chunk.
- Web preview uses memory-only storage and does not persist a token.
- Auth refresh follows native foreground/background lifecycle.
- Callback schemes and hosts are allowlisted; malformed callbacks fail closed.
- Logout is local to the device and clears user-scoped cache.
- Logs and analytics exclude email, password, token, health answers, and free text.
- Source scan found no privileged server credential in the mobile app.

Residual blocker: cross-user isolation could not be executed without two approved non-production fixtures.
