# Account claim transaction

Claim authenticates a bearer token, verifies the capability, generates the canonical profile/program inputs server-side, then calls a row-locking PostgreSQL function. Assessment, responses, profile snapshot, program, prescription, profile lifecycle, and session ownership commit together. Same-account replay returns existing IDs; another account is rejected.
