# ADR 0001: Platform foundation

Status: accepted

STHENO uses one Next.js App Router repository deployed on Vercel, Supabase for Postgres/Auth/Storage, and modules within `src/modules` for meaningful domain boundaries. This avoids premature services while separating the deterministic fitness engine, coach language adapter, commerce, and analytics.

Core prescription decisions must be structured and versioned before any language model sees them. The coach boundary accepts an `EngineDecision`; it cannot generate a prescription independently. Historical goals, measurements, prescriptions, performance, nutrition targets, and decisions are append-oriented or explicitly superseded.

Private records carry `user_id` and are protected by RLS. Server-side authorization uses `auth.getUser()`. The service role is not used by the browser and is reserved for narrow webhook/administrative flows.
