# ADR 0002: Assessment and personalization

Product 2 extends Product 1's assessment tables. Definitions are versioned independently from user attempts. Raw `assessment_responses` remain historical evidence; context candidates and personalization snapshots are separate derived records with explicit versions and provenance.

The browser never supplies ownership. API handlers authenticate with Supabase, derive `user_id` from the verified user, validate input with Zod, and repeat owner filters in addition to RLS.

Safety screening is deterministic and precedes context interpretation. Interpretation is bounded to candidate context categories and requires confirmation for material facts. It does not diagnose or prescribe. Product 3 consumes personalization profile version `1.0.0`.
