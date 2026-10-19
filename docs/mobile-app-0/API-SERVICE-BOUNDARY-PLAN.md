# API and Service Boundary Plan

## Current blocker

Most existing route handlers instantiate the Supabase SSR server client, recover authentication from cookies, and call `auth.getUser()`. A native app carries a Supabase access token, not the web cookie contract. Pointing mobile at the current routes would produce fragile redirects/authentication failures and encourage direct database coupling.

## Target boundary

Create a versioned namespace such as `/api/mobile/v1`. Each request:

1. Accepts `Authorization: Bearer <Supabase access token>`.
2. Validates the token through Supabase `auth.getUser(token)`; it does not trust decoded claims alone.
3. Constructs a request identity and invokes a shared application service.
4. Validates input/output with versioned Zod contracts.
5. Returns machine-readable error codes, a request ID, contract version, and relevant resource revision.

Web routes can progressively call the same application services. Do not fork business rules into mobile-specific handlers.

## Service categories

| Boundary | Examples | Access |
|---|---|---|
| Public acquisition | anonymous assessment create/save/resume, Blueprint | Opaque session token; rate limited |
| Account/auth companion | claim assessment, profile bootstrap, deletion/export status | Bearer token |
| Read models | Today, program, calendar, nutrition, progress, exercise catalog | Bearer token; cacheable where safe |
| Domain commands | start/complete workout, log set, swap, check-in, accept recommendation | Bearer token + idempotency/revision |
| Media | signed photo upload/download, exercise media manifest | Bearer/public policy as appropriate |
| Coach | message, action proposal, accept/reject | Bearer token; server AI only |
| Billing | entitlement status, Apple/Google receipt submission, portal link | Bearer token; provider verification server-side |
| Devices | register/revoke push token, notification preference | Bearer token |

## Direct Supabase access

Direct native Supabase access may be used for authentication and deliberately approved read-only/RLS-safe queries. Complex writes must go through commands so invariants, audit records, idempotency, and derived records are consistent. Mobile never receives a service-role key.

## Contracts and errors

- Use additive contract evolution within `v1`; breaking changes require a new version.
- Include `Idempotency-Key` for retryable creates/commands and `If-Match` or `baseRevision` for mutable resources.
- Standard errors: `AUTH_REQUIRED`, `ACCESS_EXPIRED`, `VALIDATION_FAILED`, `CONFLICT`, `RATE_LIMITED`, `OFFLINE_UNSUPPORTED`, `UPGRADE_REQUIRED`, and `INTERNAL_ERROR`.
- Return field-level validation details without database/internal messages.
- Publish retention/cache semantics for each read model.

## Security and operations

- Rate-limit public assessment and Coach endpoints by session/account plus abuse signals.
- Redact authorization, answers, messages, health context, and signed URLs from logs.
- Correlate client operation IDs with server request IDs.
- Add contract, authorization, replay, expiry, and RLS integration tests.
- Require minimum supported app version only for unsafe contracts; prefer backward compatibility.

## Completion gate

App 2 feature work may begin only after a development build can authenticate, call a bearer-protected profile/bootstrap endpoint, refresh a session, receive stable errors, and pass authorization tests without cookies.
