# Billing and Store Compliance Report

_Reviewed October 19, 2026. Store policies change; revalidate before submission._

## Current system

The website sells subscriptions through Stripe and derives application access from subscription/entitlement records. The free trial is a first-party 14-day period based on account creation; Stripe does not control the trial. This separation is valuable, but the entitlement model must become provider-neutral before native purchases.

## Recommended model

Create a normalized entitlement ledger:

```text
provider (stripe|apple|google|grant)
provider_account / original_transaction
product_key
status and period
environment
verified_at
raw_event_reference (server-private)
effective entitlement(s)
```

Apple App Store Server Notifications and Google Real-time Developer Notifications update provider records. Server verification/reconciliation computes effective access. The device never grants access solely from a purchase callback. Restore purchases, refunds, grace periods, billing retry, revocation, upgrades, family behavior, and account transfer need explicit tests.

## Apple

Apple generally requires In-App Purchase for digital subscriptions consumed in the app. Multiplatform services may let users access purchases made elsewhere, but storefront-specific rules govern external purchase links and calls to action. Current US storefront rules are more permissive; do not apply them globally. Offer IAP wherever required and have counsel/product confirm any regional external-purchase program.

Account deletion must be initiated in-app and explain subscription cancellation. Deleting a STHENO account does not itself cancel an App Store subscription.

Authoritative sources:

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [In-App Purchase design guidance](https://developer.apple.com/design/human-interface-guidelines/apple-in-app-purchase)
- [Auto-renewable subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Account deletion requirements](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)
- [Apple Developer Program](https://developer.apple.com/programs/whats-included/)

Apple Developer Program membership is currently US$99/year. Eligible developers may apply for the Small Business Program's reduced commission; verify eligibility and current terms at enrollment.

## Google Play

Fitness subscriptions and other in-app digital services generally require Google Play Billing unless an applicable regional program applies. A consumption-only application may let existing purchasers sign in while offering no in-app purchasing, but that is a product decision and may reduce conversion. US/EEA/UK alternative billing/external-offer programs have enrollment and UX/reporting requirements; do not assume one global rule.

Authoritative sources:

- [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/10281818)
- [Service fees](https://support.google.com/googleplay/android-developer/answer/112622)
- [2026 US/EEA/UK billing changes](https://support.google.com/googleplay/android-developer/answer/16954621)
- [Developer registration](https://support.google.com/googleplay/android-developer/answer/6112435)
- [Account deletion](https://support.google.com/googleplay/android-developer/answer/13327111)

Google Play Console registration is currently US$25 one-time. Subscription/service fee details now depend on program, region, and billing choice; finance must validate the launch model instead of hardcoding a universal percentage.

## Product decisions required

1. Storefront countries and regional link/billing strategy.
2. Monthly/annual product IDs, prices, trial eligibility, upgrade/downgrade rules, and web/store parity.
3. Whether V1 is consumption-only temporarily or supports native purchase at launch.
4. Restore/manage subscription UX and support process.
5. Tax/banking, reduced-fee program enrollment, and revenue reporting owner.

## Release gate

Do not submit until sandbox purchases, renewals, cancellation, refund/revoke, grace period, reinstall/restore, cross-platform purchase, account deletion, and webhook/notification replay all produce the same effective entitlement.
