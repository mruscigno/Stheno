# Exercise content system root-cause analysis

Date: 2026-09-29  
Scope: the live `svtmyxbjlbfmtysqqqwt` production project and the code that reads or mutates its exercise corpus.

## Authoritative data and schema

The authoritative public dataset is `public.exercises` in production Supabase. The current production slice is `status = 'production'`; it contains **567** rows. Public pages apply additional review and publication filters. Historical JSON payloads and SQL migrations are import sources, not a second runtime catalog.

The exercise identity and programming fields live on `public.exercises`: `id`, `slug`, `name`, `aliases`, `family`, `exercise_type`, `movement_pattern`, `exercise_role`, muscle arrays, equipment arrays, difficulty/skill metadata, `rep_min`, `rep_max`, `purpose`, `education`, cautions, review fields, indexability/prescribability flags, provenance, and `production_ready`. Instructions are embedded in `education` JSON. Reviewed alternatives live in `public.exercise_alternatives`; the older `public.exercise_substitutions` table exists but currently has zero edges. Media lives in `public.exercise_media`, with source provenance in `public.exercise_media_sources`.

The existing `exercise_type` is a broad content category (`strength`, `cardio`, `mobility`, `stretching`, `loaded_carry`, and similar), not a prescription model. The absence of a separate prescription/movement type is why timed holds, carries, cardio, and mobility have inherited `rep_min`/`rep_max` and rep-oriented presentation.

## Creation, import, and overwrite paths

The original catalog was created by the foundation and Product 3 migrations, expanded by EL-1 through EL-6, and then bulk-enriched by Product 16 payload builders and batch migrations. Product 17 added provider exercise records and licensed media mappings. These migrations remain historical and can rebuild an environment, but they are not scheduled production jobs.

The dangerous path was Product 16's bulk update. It applied a shared fallback purpose (`Build controlled strength and skill in the listed primary muscles.`), common instruction scaffolding, and then set publication/review fields to reviewed/true in the same import. Its completion gate measured field presence, counts, media, and alternative counts—not semantic correctness. Later imports replaced only some rows, leaving a mixed corpus.

There is no CMS approval workflow in front of these historical SQL imports. Today, publication is represented by database flags. The 2026-09-29 integrity trigger rejects the known placeholder description and a small set of known contamination signatures, but it does not yet model prescription type or comprehensive semantic validity. This remediation adds those missing gates before any further corpus publication.

## Why the failures happened

### How did semantically unrelated text become attached to an exercise?

Bulk generation joined structured exercise identity records to generated education blocks by slug and trusted the generated block. The database enforced JSON shape, not agreement among name, pattern, muscles, equipment, and instructions. A valid-looking block could therefore be attached to the wrong exercise and still pass. Pattern fallbacks in `completeExerciseGuide` can also mask poor stored content at render time, making the page look complete without repairing the source row.

### How did generic placeholder descriptions become `PRODUCTION_READY`?

Product 16 explicitly used the shared fallback in `coalesce(...)` and set `production_ready`, `review_status`, and technical/editorial/visual review fields at import time. The completion gate counted populated records rather than independently validated records. In other words, publication status was assigned by the same operation that generated the content.

### Why did previous full-library audits miss equivalent problems?

Earlier checks focused on nulls, minimum array lengths, known exact phrases, a few contamination signatures, and structural media/edge integrity. They did not have an explicit movement prescription taxonomy, did not compare language to movement type, and treated thousands of repeated generic cues as non-blocking editorial warnings. They also inspected rendered fallbacks in some paths rather than requiring source content to pass. Named regressions were fixed without converting their defect classes into durable corpus-wide rules.

### Can corrected content be overwritten later?

Yes, if historical bulk SQL is replayed into a fresh environment or an import script again writes reviewed/publication flags without validation. There is no currently detected scheduled job that continually rewrites production. The prevention must therefore exist at three layers: deterministic database constraints/triggers, a pre-publication validator used by import tooling, and a CI/full-corpus audit. Historical source builders must also stop emitting prohibited fallback copy.

## Runtime loading, caching, and rendering

`src/lib/exercises/public-catalog.ts` is the public loader. `/exercises` and `/exercises/[slug]` query Supabase and require production plus review/indexability gates. The authenticated API route performs a similar query but currently computes alternatives ad hoc; the public page also derives alternatives from broad muscle overlap. This duplicates ranking behavior and bypasses the reviewed alternative graph.

Next.js server components render public exercise pages. No explicit long-lived application cache wraps the catalog loader; platform/CDN behavior follows the route's dynamic Supabase access. The homepage is server-rendered through `HomepageEntryGate`; its loading state now preserves the full marketing children instead of replacing crawlable HTML with a client-only loading shell.

## Remediation architecture

1. Add a separate `movement_type` prescription taxonomy and typed prescription metadata.
2. Classify all 567 production rows deterministically, then review every non-dynamic class and all ambiguous records.
3. Validate source fields and cross-field semantics before allowing `production_ready = true`.
4. Make failed critical validation downgrade a row to review-required rather than silently retaining publication status.
5. Use one reviewed substitution graph and one scoring model; stop recomputing alternatives differently by route.
6. Make the live corpus audit emit human and machine-readable reports and fail CI on critical defects.
7. Keep licensed media optional: instruction-only exercises are valid because STHENO intentionally removed unlicensed/generated fallbacks.

## Data snapshot contract

The QA command reads all production rows from Supabase, verifies returned rows equal the authoritative count, and exports the complete validation projection (identity, taxonomy, muscles, equipment, programming, content, review state, alternatives, and media references). The generated JSON report is the deterministic audit artifact; the production database remains authoritative.
