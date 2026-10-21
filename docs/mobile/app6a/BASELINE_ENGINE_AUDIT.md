# App 6A baseline engine audit

Date: 2026-10-21

App 6A extends the existing engines rather than replacing them. The repository already has deterministic program generation, workout progression, substitutions, nutrition targets, nutrition-adjustment gates, weekly coaching, a 28-day monthly review, and one web/mobile Coach route. The detailed call-path inventory is in `ENGINE_TRACEABILITY.csv`.

## Preserved foundations

- Production exercise identity and media remain sourced from the canonical Supabase-backed exercise layer. The small list in `src/modules/training/exercises.ts` is a deterministic test fixture, not the production catalog.
- Workout writes continue through the App 5B1R transactional protocol and durable outbox. App 6A does not introduce a second write path.
- Monthly review actions remain proposals until the member accepts all, accepts selected actions, or declines. `src/platform/server/monthly-reviews.ts` is the application boundary.
- Coach actions remain confirmation-required deterministic proposals. The language model may explain a decision but may not mutate a plan.
- Nutrition adjustments require complete logging, adequate adherence, and a multiweek trend. Partial days are not evidence of under-eating.

## Baseline limitations App 6A will address

1. Rule versions exist in individual engines but there is no shared, queryable policy/claim registry.
2. Coach receives reviewed database evidence but does not receive the same policy boundaries and explanations used by deterministic engines.
3. Supplements have no single evidence-and-safety matrix.
4. Newly generated weekly/monthly decisions expose reason codes but not a shared methodology version or policy IDs.
5. App 6B lacks a reviewed, exercise-specific form rubric contract.

## Non-goals

App 6A will not rewrite active member programs, silently apply recommendations, add medical advice, infer body-fat percentage from images, add video upload or analysis, claim expert endorsement, or claim native-device validation.
