# Web Parity Report

## Preserved

- No page, component, marketing copy, SEO metadata, pricing, article, calculator, Social Studio, contact, or navigation file changed.
- No canonical exercise or media file changed. The automated identity/media gate remains 330/298.
- Stripe checkout, portal, refund, webhook, subscription, and entitlement code is unchanged.
- Assessment/Blueprint branching and the free-form field are unchanged.
- Today, program, nutrition, workouts, progress, photos, and monthly scheduling schemas are unchanged.
- The existing `/api/coach` response and behavior are preserved; only its auth context now accepts a valid bearer token as well as its established cookie session.

## Adapters

The new `/api/v1` surface sits beside legacy routes. It calls extracted server services for member/exercise/read models and workout/monthly operations. Existing web screens continue calling existing routes, avoiding a risky wholesale handler rewrite in App 1.

## Regression evidence

Baseline: lint/typecheck/208 tests/build passed. Final evidence is recorded in `TEST_RESULTS.md`. Tests explicitly pin all exercise identities and media manifest structure, shared contract boundaries, transport auth behavior, and idempotency payload identity.

## Deferred parity

Native clients do not yet have versioned endpoints for assessment sessions, photos, nutrition writes, workout substitution/adaptation, or monthly intake completion. Existing web functionality remains intact; these are App 2/3/5 API gaps, not web regressions.
