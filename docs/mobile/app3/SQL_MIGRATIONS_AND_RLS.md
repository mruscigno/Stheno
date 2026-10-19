# SQL migrations and RLS

`20261019213000_mobile_app3_anonymous_assessment_claim.sql` adds one server-only session table, a source link on assessments, and one atomic claim function. RLS is enabled and all table privileges are revoked from anon/authenticated. The narrowly scoped function is executable only by authenticated callers and verifies `auth.uid()`, capability hash, expiry, finalized state, and claimant ownership while holding a row lock.
