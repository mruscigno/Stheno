# App 6D-2A production activation report

## Verdict

**IMPLEMENTED WITH EXTERNAL BLOCKERS.** The zero-cost production scheduler and the 103 reviewed purchased-media links are live. Website playback and fallback behavior are verified. Current-source Android playback is covered by a genuine API-35 validation workflow; its final run result is recorded below. Bulk expansion beyond the reviewed set remains intentionally stopped at the product's paid-inference budget gate.

## Production release

- Vercel deployment: `dpl_FZDJNQwaJVDmRWtjvoTviKqYxu8w`
- Staged and promoted URL: `https://stheno-2zxvtkkmp-ai-path-forge-s-projects.vercel.app`
- Production application commit: `edd10340665e53d7e12e7678dab06abab7a62299`
- Scheduler correction commit: `f3adb192746ddb804b0cc74f2ccf007172a36d7e`
- Android evidence candidate commit: updated by the final Android validation run below.
- Production host: `https://www.sthenofitness.com`

## Zero-cost scheduler migration

Supabase production already included Vault and supports `pg_cron` 1.6.4 and `pg_net` 0.20.4. Both extensions were enabled without adding a scheduler vendor or upgrading Vercel. The protected worker route and worker transaction implementation were preserved.

The production schedule is:

- `stheno-workout-outbox-every-10-minutes`: `*/10 * * * *`
- `stheno-workout-outbox-response-reconcile`: `* * * * *`

The endpoint and rotated 64-character bearer credential are stored in Supabase Vault. Neither value is embedded in migration SQL or source control. Public, anonymous and authenticated roles have no access to the private functions or request ledger.

Cutover validation established:

- an unauthenticated staged request returned HTTP 401;
- an authenticated staged request returned HTTP 200 with `ok: true` and complete before/after outbox counts;
- the first natural ten-minute production invocation succeeded;
- the private request ledger recorded HTTP 200 and `successful = true`;
- `cron.job_run_details` records successful scheduler and reconciliation executions;
- pending, processing, dead-letter and oldest-pending metrics remain present in the worker response;
- overlapping requests remain safe because claims use leases, row locking with `FOR UPDATE SKIP LOCKED`, operation receipts and idempotent acknowledgement.

### Monitoring and recovery

Monitor `cron.job_run_details` for failed jobs and `private.workout_outbox_scheduler_runs` for non-2xx, timeout or error rows. The response ledger retains the worker's queue snapshot. Failed or abandoned events remain recoverable through existing lease expiration and retry/dead-letter behavior; a manual `select private.enqueue_workout_outbox_run();` invokes the same protected path.

### Scheduler rollback

Disable both jobs through `cron.alter_job(job_id, active => false)`. The worker route remains deployed and can be invoked manually with the Vault-held credential. Re-enabling the old Vercel schedule is intentionally not the primary rollback because Hobby rejects its ten-minute frequency; use a supported daily Vercel schedule only as an emergency degraded mode, never concurrently with the active Supabase trigger.

## Media activation

Production verification after promotion returned:

- 103 provenance assets;
- 206 approved derivatives;
- 103 fully reviewed active links;
- 103 immutable review events;
- 206 public storage objects;
- 78 existing exercises with upgraded demonstrations;
- 298 preserved Vital licensed fallback mappings;
- zero new unreviewed canonical exercises promoted.

The public bucket remains restricted to MP4 and WebP with a 25 MiB object limit. RLS permits read-only access to approved derivatives and fully reviewed active links; provenance and review-event tables remain private and all client writes remain denied.

The production Barbell Bench Press guide returned HTTP 200, resolved the reviewed 6D-2 MP4, and played in the real browser. The MP4 returned HTTP 200, `video/mp4`, and the expected byte length. Goblet Squat, which has no new active link, returned its existing `/exercise-media/vital/videos/goblet-squat.mp4` fallback and did not resolve a 6D-2 object.

Primary demonstrations remain first in `mediaGallery`; supplementary technique clips retain their explicit role and appear only where linked. Written instructions, alternatives and assessment CTA remain intact.

## Android playback evidence

GitHub Actions workflow `App 6D-2A current-source Android media playback` builds a fresh APK from the checked-out commit, launches the real native exercise route on an API-35 emulator, asserts the `exercise-guide-media` and `Reviewed purchased demonstration` accessibility evidence, taps the native video, and proves two later screenshots differ. It also captures the APK hash, source SHA, screenshots, UI hierarchy, activity/window state and logcat, and fails on Android fatal exceptions.

- Initial diagnostic run: `https://github.com/mruscigno/Stheno/actions/runs/41481094975`
- Initial result: the genuine app reached the Barbell Bench Press guide and rendered the reviewed purchased demonstration, but the headless emulator's unrelated Quickstep launcher ANR covered the accessibility hierarchy. The captured screenshot and UI/window dumps classified this as automation, not an app defect. The harness now applies the same Quickstep isolation already used by the established workout acceptance suite.
- Final run: pending at report creation; update required before final release declaration.

The workout screen opens this same guide route without unmounting the workout provider, so timers and logged set state remain owned by the persistent root provider. Existing Android offline acceptance remains separately preserved by the App 5B-2U suite.

## Classifier and catalog expansion

The remaining 1,290 held assets were rematched against the real 567-exercise production taxonomy:

- 40 exact current-taxonomy candidates;
- 386 lexical/alias candidates requiring visual equipment/variant confirmation;
- 193 explicit nearby-variant ambiguities;
- 671 taxonomy gaps, composite clips, generic labels or unmatched records.

The four-frame visual analysis showed that the local CLIP classifier cannot safely separate close exercise/equipment variants, and generic filenames cannot supply the missing semantics. Confidence thresholds were not lowered and no founder-scale manual review was requested. No unverified new exercise was published.

The approved provider's configured worst-case budget is 40,000 input and 2,000 output tokens per review, or **$0.039 per asset** at the repository's verified rates. A worst-case 1,290-asset run is therefore **$50.31**. The mandatory per-review cap, monthly cap and kill switch are unset, so no paid inference was run and actual AI cost is **$0.00**. Explicit spending authorization and configured budget controls are required before that bulk job can proceed.

## Regression and security results

- TypeScript typecheck: passed.
- Scheduler contract: 12/12 checks passed.
- Exercise resolver, 330-ID/checksum baseline and workout operation tests: 7/7 passed.
- Production schema/RLS/bucket verification: passed.
- 330 original compatibility IDs: preserved.
- 298 licensed fallback mappings: preserved.
- Existing assessment, Blueprint, Nutrition, Coach, Progress, Stripe and entitlement code: unchanged by this release.
- Existing durable outbox route and transaction semantics: preserved.
- Production migration history: not repaired, rewritten or bypassed; the additive SQL was applied narrowly and verified.

## Outstanding risks and blockers

1. Paid multimodal inference is blocked by absent authorization and closed budget controls. This prevents safe automatic recovery of the remaining ambiguous collection, not operation of the 103 live reviewed assets.
2. No additional canonical exercise is eligible until its multi-frame identity, instructions, safety data, substitutions and demonstration pass the existing review gates.
3. The Android workflow result must be successful and its artifact inspected before changing this report from implemented-with-external-blockers to complete.

## Media rollback

Set production `STHENO_MEDIA_6D2_ENABLED=false` and redeploy to return every guide to the preserved Vital fallback resolver. For a data-layer rollback, deactivate 6D-2 links without deleting assets, derivatives, review history or storage objects. This keeps rollback reversible and avoids changing workout history or canonical exercise identity.
