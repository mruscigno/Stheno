# pgTAP and two-user results

App 5A's 16-test transaction suite remains the behavioral foundation. It creates disjoint A/B identities and sessions, proves A cannot address B, proves B cannot read A receipts under production-style JWT claims, and validates rollback. App 5B-1 adds a 12-test privilege/RPC suite. Both run against ephemeral PostgreSQL 17 in the zero-cost workflow; no production data is used.
