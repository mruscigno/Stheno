# Deployment and rollback

Safe deployment scope is additive code with both feature flags absent/false. The database migration must be applied before either flag is enabled. Rollback is to disable both flags and revert the application commit; the private table/bucket may remain dormant. Never drop the table or bucket until retention/deletion is reconciled.

