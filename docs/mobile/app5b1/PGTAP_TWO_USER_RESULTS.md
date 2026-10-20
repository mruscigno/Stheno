# pgTAP and two-user results

App 5A's 20-test transaction suite remains the behavioral foundation. It creates disjoint A/B identities and sessions, proves A cannot address B, proves B cannot read A receipts under production-style JWT claims, and validates rollback at both internal failure-injection boundaries. App 5B-1 adds a 12-test privilege/RPC suite. Both passed against ephemeral PostgreSQL 17 in CI run [39485319036](https://github.com/mruscigno/Stheno/actions/runs/39485319036); no production data was used.
