# Anonymous session design

Creation returns a 256-bit random base64url capability once. Only SHA-256 is stored. Every read/write/finalize/claim requires both UUID and capability, while UUID alone proves nothing. Sessions expire after 30 days. Writes use optimistic revisions; stale writes return 409. Finalization is idempotent. SecureStore uses device-only unlocked accessibility, so restart survives; reinstall recovery is not promised.
