# App 7 / App 8 handoff

App 7 may consume the existing workout receipt/server-outbox stream; it must not create a second workout state engine. App 8 may layer store distribution and native billing only after reconciling entitlements with the existing Stripe/web authority. Both must preserve the SQLite owner boundary, stable operation IDs, revision conflicts, receipt recovery, the 330 checksum, and the 298 purchased mappings.
