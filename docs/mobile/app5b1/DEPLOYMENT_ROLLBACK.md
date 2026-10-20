# Deployment and rollback

Preflight requires migration-history comparison, isolated migration replay, both pgTAP suites, real concurrency, build/regression tests, advisors, and invariant checks. Apply App 5A then App 5B-1 in order. Roll forward is preferred. For emergency rollback, route traffic to the prior adapter, drop only the public receipt lookup and adapter, move the private function back to public, and restore grants. Never drop receipts/outbox/tombstones during a rollback because supported clients may still replay.

The linked production preflight on 2026-10-20 found extensive timestamp/history divergence between local and remote migrations. Therefore no production migration or Vercel deployment is authorized by this package's hard gate until history is reconciled against actual remote schema without replaying old local migrations.
