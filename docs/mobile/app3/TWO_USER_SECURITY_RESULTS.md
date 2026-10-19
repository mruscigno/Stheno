# Two-user security results

Static controls are implemented: capability hashes at rest, table grants revoked, authenticated RPC, `auth.uid()` equality, row lock, same-user replay, and cross-user rejection. A live two-fixture adversarial run was not possible in this environment and remains a release blocker.
