# App 6D-2A implementation report

## Verdict

**IMPLEMENTED WITH EXTERNAL BLOCKERS.** The previously approved 103-asset set is now stored, linked, reviewed and enabled at the production data layer. The remaining 1,290 held records were reprocessed against the real 567-exercise production taxonomy and no longer share a generic low-confidence reason. Automatic publication is blocked for records that still require fine-grained visual review, and the application flag is fail-closed because Vercel refused the production build on the current Hobby plan.

## Root cause and classifier diagnosis

The prior four-frame CLIP run was real visual inference, not filename-only matching. It failed because the candidate vocabulary was limited to the legacy 330 compatibility catalog and because general CLIP embeddings do not reliably separate fine exercise variants, equipment variants, composite coaching clips or technique-only close-ups.

A deterministic, stratified sample of 100 held assets was built across source archives and rematch outcomes. Codex multimodal inspection reviewed all 100 four-frame contact sheets in ten montages. The runtime does not expose a billable model identifier or token/cost counters, so those values cannot be honestly reported. The inspection showed:

- exact production taxonomy matches were materially reliable in the sample;
- loose containment/alias matches often found the movement family but collapsed important equipment or setup differences;
- generic filenames such as `Workout` and `Exercise Video` cannot be classified from filename evidence;
- premium clips often depict a technique principle, comparison or multi-exercise circuit rather than one canonical exercise;
- genuine taxonomy gaps exist, including movements such as long jump, Cossack squat, Korean dips, boxing jab, planche, and seated band hip abduction;
- visual evidence is essential for close variants and collection-role classification.

The revised pipeline therefore uses production name/slug/aliases, filename normalization, equipment and movement metadata, runner-up margin, duplicate identity, and explicit abstention categories. It does not treat a broad movement-family match as publication-safe.

## Complete held-set reprocessing

`PRODUCTION_TAXONOMY_REMATCH.csv` contains all 1,290 formerly generic holds with a specific recommendation and reason:

- 40 exact current-production taxonomy matches;
- 386 high lexical/alias matches that still require equipment/variant visual confirmation;
- 193 records with explicit nearby-variant ambiguity;
- 671 proposed taxonomy gaps, composite clips, generic labels or unmatched records requiring visual/coaching review.

No row is silently mapped or published from lexical evidence alone. The 40 exact matches are recovery candidates, not automatically activated media, until their full visual and technical release gate is completed.

## Production activation evidence

Production was inspected before mutation. The exercise table contained 567 rows and the App 6D-2 media tables were absent. Because production migration history is divergent, no `db push`, migration-history repair or false ledger marking was used. The reviewed additive SQL was applied directly and verified.

Current verified production state:

- public bucket `exercise-media-6d2`, restricted to MP4/WebP and 25 MiB per object;
- 103 private provenance assets;
- 206 approved derivatives (video and poster);
- 103 active, fully reviewed exercise links spanning 78 current exercises;
- 103 immutable review events;
- 206 uploaded storage objects;
- public roles can read only approved derivatives and fully approved active links;
- public roles cannot read provenance/review-event tables or write any catalog table;
- sampled public MP4 request returned HTTP 200, `video/mp4`, and the expected byte length;
- the rollout remains instantly reversible through `STHENO_MEDIA_6D2_ENABLED=false` or link deactivation; the 298 Vital fallbacks are unchanged;
- the production application flag is currently `false`, so the existing site continues to use its preserved fallback behavior until a valid deployment passes.

## External blocker

The repository contains an approved OpenAI visual-inference provider, but its mandatory cost kill switch and monthly/per-run budget variables are not configured. Running 1,290 paid multimodal classifications with the project key would bypass the product's own spend controls. That was not done. The local CLIP model is demonstrably below the required false-positive threshold, so it is not a safe substitute.

This blocker affects only bulk recovery beyond the 103 already-reviewed assets. It does not block the reviewed production activation delivered here.

Vercel also rejected the staged production deployment because this project is currently on Hobby while the preserved workout-outbox cron runs every ten minutes. Hobby deployments permit only daily cron schedules. The cron was not weakened or removed because doing so would regress the existing durable workout synchronization system. No untested build was promoted.

## Preserved invariants

- the legacy 330 canonical compatibility IDs/checksum are unchanged;
- all 298 purchased Vital mappings remain available as fallback;
- existing exercise, program, workout, subscription and member records were not deleted or rewritten;
- public visibility and prescription eligibility remain separate;
- no unverified new exercise was inserted into production;
- no migration history was repaired, bypassed or falsified.
