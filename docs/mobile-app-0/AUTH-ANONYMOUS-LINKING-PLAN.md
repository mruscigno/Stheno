# Authentication and Anonymous Linking Plan

## Required experience

The user opens the app at the first assessment question, completes the full branched assessment anonymously, optionally adds permitted photos, receives a Blueprint, and only then creates or signs into an account. Signup must preserve the completed work and lead directly into the member experience.

## Anonymous session model

Add server-managed records resembling:

- `anonymous_assessment_sessions`: UUID, schema version, status, current step, revision, expiry, created/updated timestamps, claim-secret hash, claimed user/time.
- `anonymous_assessment_answers`: session, question key, normalized answer, revision, timestamps.
- `anonymous_assessment_uploads`: session, object key, status, content metadata, expiry and deletion state.
- `anonymous_claim_receipts`: session, user, idempotency key, resulting assessment/program IDs, timestamp.

Return a high-entropy opaque claim token once. Store only its hash server-side and store the token in device-protected local storage. Anonymous endpoints authorize with the token, not an open UUID and not permissive RLS.

## Save and resume

- Device writes each answer locally first, then upserts it with the current session revision.
- Server returns a new revision and normalized current step.
- A resume link contains a one-time exchange token, not raw answers or a durable claim token.
- Sessions expire after a documented period; reminders and deletion follow consent/retention policy.
- Multiple-device conflicts preserve explicit newer answers and return a conflict response rather than silently replacing an assessment.

## Account linking

After Supabase signup/sign-in, call a transactional claim command with the anonymous token and idempotency key. The database transaction must:

1. Lock and validate the unexpired session.
2. Return the existing receipt if this claim already succeeded.
3. Reject a claim by a different account.
4. Create/attach the canonical assessment and answers.
5. Build the profile/Blueprint/program through the authoritative services.
6. Move approved staged photos to account-owned paths.
7. Record legal acceptance and the claim receipt.
8. Mark the session claimed and revoke the anonymous credential.

If any step fails, nothing is partially claimed. Retrying with the same idempotency key returns the original result.

## Native authentication

- Use Supabase's React Native session model and SecureStore-backed token storage.
- Configure Universal Links/App Links and a custom-scheme fallback for email verification, magic links, and password reset.
- Refresh tokens through the Supabase client; never log tokens or put them in AsyncStorage.
- After authentication, alias the analytics anonymous installation identity to the account identity exactly once.
- Provide explicit sign-out that clears tokens, private caches, queued account operations, signed URLs, and notification tokens while preserving only consented anonymous drafts.

## Photos

Anonymous photos materially increase privacy and abuse risk. If retained as a V1 requirement, stage them in a private `anonymous/<session>` prefix through short-lived signed uploads, validate MIME/size, strip EXIF, malware-scan if available, and delete unclaimed objects on a short TTL. Do not include photos in backups beyond the stated policy. If legal/privacy review does not approve this design, defer anonymous photos rather than weakening access controls.

## Tests

Cover interrupted signup, duplicate callback, expired token, stolen/replayed token, two-account claim, retry after timeout, app reinstall, schema upgrade, upload without claim, deletion after expiry, and exact program parity with the web claim flow.
