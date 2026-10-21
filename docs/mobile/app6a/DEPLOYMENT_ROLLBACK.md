# Deployment and rollback

Deploy through the existing Vercel production pipeline after lint, typecheck, unit/integration tests, build, catalog/media verification, and web smoke checks pass.

Set `STHENO_METHODOLOGY_COACH=false` to remove the shared policy context from Coach. Set `STHENO_METHODOLOGY_V2=false` to remove additive policy metadata. Neither rollback changes stored member plans. A full rollback may promote the prior Vercel deployment.
