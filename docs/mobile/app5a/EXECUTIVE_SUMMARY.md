# App 5A executive summary

App 5A replaces the mobile workout API's split “write, then receipt” sequence with one PostgreSQL transaction. Every accepted operation now locks the owned session, checks its revision, writes the domain change, advances the revision, records a replay receipt, and appends one outbox event before commit.

The implementation is additive and does not change native UI, the public web workout flow, assessment, Blueprint, billing, Coach, nutrition, analytics, or the exercise catalog. Production is intentionally not migrated until the isolated CI database proves the migration and pgTAP matrix.
