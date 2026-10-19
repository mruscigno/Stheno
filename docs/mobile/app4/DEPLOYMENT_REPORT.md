# Deployment report

Backend changes are additive v1 adapters and a preference update. No schema migration was required.

- Commit: `9f3b363`
- Deployment: `dpl_CK7DUmjfEDkpk8aSqGxsZYDr7skW`
- State: `READY`, production
- Custom-domain health: `https://www.sthenofitness.com/api/health` returned 200 and version `9f3b363`.
- Auth boundaries: anonymous member, Coach, and adaptation requests returned structured 401 responses; the adaptation route rejects unsupported GET with 405.
- Production error scan: no errors observed in the post-deploy window.
