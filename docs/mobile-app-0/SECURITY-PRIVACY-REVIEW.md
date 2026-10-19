# Security and Privacy Review

## Data classification

Assessment answers, training history, nutrition records, body measurements, progress photos, Coach messages, and injury/limitation context are sensitive personal data even when they are not legally regulated health records. Treat all as restricted. Credentials, refresh tokens, provider receipts, signed URLs, and deletion tokens are secrets.

## Existing strengths

- Member tables use user ownership and Supabase RLS.
- Public catalog access is read-only.
- Progress photos are private and returned by short-lived signed URLs.
- Analytics filtering removes sensitive-looking keys and oversized strings; web autocapture is constrained.
- Server observability is configured to avoid PII.

## Required mobile controls

- Store access/refresh tokens only in SecureStore; never in AsyncStorage or logs.
- Ship only public Supabase configuration. Never include service-role, Stripe, AI, email, or store server credentials.
- Validate bearer tokens server-side and enforce authorization in both service layer and RLS.
- Encrypt private SQLite data using a reviewed native solution or encrypt sensitive payload fields with a SecureStore-held key; clear on sign-out/account switch.
- Redact request bodies, query strings, messages, answers, photo paths, and signed URLs from crash/network telemetry.
- Use TLS; certificate pinning is optional after threat-model review and must have a safe rotation/bypass plan.
- Rate-limit anonymous assessment, authentication companion, photo, Coach, and receipt endpoints.

## Photos

Strip EXIF/location metadata before upload, validate MIME by bytes, constrain dimensions/size, use private paths, and background-upload only with explicit status. Screenshot protection is not a reliable privacy control. Define deletion, export, backup, and unclaimed-anonymous retention. Signed URLs should be short-lived and never cached in analytics.

## Analytics and notifications

Create a stable random installation identity, alias it to an account after signup, and reset on account deletion. Track named product milestones without answer values, symptoms, weight, calories, messages, exercise notes, or photo metadata. Implement jurisdiction-appropriate consent and an account preference. Push payloads should be generic on the lock screen unless the user opts into detail.

## Store disclosures

Complete Apple's privacy nutrition labels and Google Play Data Safety from actual SDK/data behavior. Google requires a health-app declaration for fitness-related features; review the [Health apps declaration guidance](https://support.google.com/googleplay/android-developer/answer/14738291). Maintain privacy policy, terms, support URL, deletion instructions, and processor/subprocessor inventory.

## Account rights

Expose export and deletion inside Account. Deletion must cover Supabase Auth, domain data, photos, device tokens, analytics identity requests where supported, and pending anonymous sessions, while retaining only legally required billing/audit records. Explain that store subscription cancellation may be separate and deep-link to platform management.

## Threat scenarios to test

- Cross-account cache/outbox leakage after sign-out.
- IDOR against plan, workout, photo, Coach, and export identifiers.
- Anonymous claim-token guessing, replay, expiry, and two-account claims.
- Malicious file/type mismatch and EXIF leakage.
- Rooted/jailbroken device token extraction (reduce impact; do not promise prevention).
- Stolen refresh token, revoked access, stale signed URL, webhook replay, receipt reuse, and push-token reassignment.

## Pre-launch gate

Complete mobile-specific threat modeling, dependency/SBOM review, secret scanning, RLS integration tests, API abuse tests, privacy/data-flow mapping, deletion drill, backup/restore verification, and incident-response ownership before external beta.
