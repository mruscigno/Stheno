# Prerequisites and Costs

_Known public prices checked October 19, 2026; taxes, regional pricing, usage, and policies can change._

## Founder actions before App 1/2

- Confirm legal entity, public developer name, `STHENO` app name availability, and bundle/application ID (recommended `com.sthenofitness.app`).
- Enroll the entity in Apple Developer and Google Play Console; complete identity, tax, banking, agreements, and team access.
- Apply for Apple/Google reduced-fee programs if eligible.
- Reserve product IDs and decide monthly/annual prices, trial rules, launch countries, and consumption-only versus in-app purchase strategy.
- Obtain written Vital Animations rights for native app streaming, store redistribution, bundling, derived posters, caching, and offline download; reconcile all 298 assets to provenance.
- Approve privacy policy, terms, support URL, deletion SLA, health declaration, Data Safety, Apple privacy labels, age/content rating, analytics consent, and photo retention.
- Supply Apple/Google signing and push credentials through approved secret management when requested.

## Platform and service costs

| Item | Current public cost / planning assumption | Timing |
|---|---|---|
| Apple Developer Program | US$99/year | Before TestFlight/store services |
| Google Play Console | US$25 one-time | Before internal Play testing |
| Expo Free | 15 Android + 15 iOS builds and 1K update MAU | Prototype only |
| Expo Starter | US$19/month, build credit and 3K update MAU | Recommended during active prelaunch |
| Expo Production | US$199/month | Consider only when scale/support justifies it |
| Store commissions/billing fees | Vary by provider, region, program, and billing choice | Model before App 2B |
| Supabase, Vercel, analytics, Sentry, Resend | Existing plans plus mobile usage growth | Monitor per environment |
| OpenAI Coach | Usage-based | Add budget/rate limits |
| Test hardware | At least a recent iPhone and representative midrange Android if unavailable | Before App 2 QA |

Sources: [Apple Developer Program](https://developer.apple.com/programs/whats-included/), [Google registration](https://support.google.com/googleplay/android-developer/answer/6112435), [Expo pricing](https://expo.dev/pricing), [Apple subscriptions](https://developer.apple.com/app-store/subscriptions/), and [Google fees](https://support.google.com/googleplay/android-developer/answer/112622).

## Engineering prerequisites

- Dev/staging/production environment separation and test accounts.
- Mobile API authentication and contract versioning.
- Database migrations for anonymous sessions, claims, device registrations, provider entitlements, sync receipts/revisions, and tombstones.
- CI build/test lanes, EAS projects, release channels, crash symbols/source maps, and dependency scanning.
- Store sandbox products and webhook/notification endpoints.
- Support runbooks for access, restore, deletion, lost assessment, sync conflict, and photo removal.

## Not included in public prices

Engineering/design/QA labor, legal/privacy review, tax advice, localization, accessibility audit, device lab/cloud testing, customer support, media license amendments, and paid acquisition are separate. Do not assume the Expo Free tier or reduced store fee is guaranteed for production.
