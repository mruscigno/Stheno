# App 3 handoff

App 3 should extend the existing shell, not replace it.

Priority work:

1. Implement server-backed anonymous assessment session, resume, and secure one-time account claim from the App 1 design.
2. Replace the App 2 single-question scaffold with the full shared assessment renderer.
3. Generate and retrieve Blueprint through versioned API contracts.
4. Add conflict/idempotency handling and explicit offline behavior.
5. Preserve SecureStore, bearer transport, strict deep-link parsing, entitlement routing, and privacy-safe analytics.
6. Run the two-user isolation matrix before shipping authenticated writes.

Do not store anonymous assessment answers as a fake local production workflow or duplicate the web scoring engine in the client.
