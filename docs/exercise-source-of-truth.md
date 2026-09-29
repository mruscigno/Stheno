# Exercise source of truth

## Authoritative source

Production Supabase `public.exercises` is the only production source for exercise identity, metadata, guidance, prescription semantics, and provenance. Public pages, authenticated APIs, and program generation use `src/lib/exercises/canonical.ts`.

The canonical identity is `exercises.id`; `slug` is the stable URL and integration key. Display names are attributes and must not be used to join records.

## Canonical retrieval

`getCanonicalExercise()` and `listCanonicalExercises()` apply the production release gate, require complete reviewed guidance, and return the stored guidance without adding or replacing prose. `loadCanonicalTrainingLibrary()` maps those same records into the deterministic program engine's constrained type.

The legacy 20-record module in `src/modules/training/exercises.ts` is retained only as a deterministic unit-test fixture. No production route or service imports it.

## Provenance and fallback rules

`guidance_provenance` records the source of setup, execution, cues, mistakes, feel, and stop/modify guidance. Production-ready records must use reviewed or curated content and may not use `FALLBACK`.

`completeExerciseGuide()` preserves reviewed production fields exactly. It fails closed when production guidance is missing. Generic movement-pattern completion remains available only to explicit draft/internal callers; it is not part of canonical production retrieval.

## Production-ready rules

The database trigger requires a description, movement type/pattern, primary muscles, equipment, and every customer-facing guidance field. It intentionally checks presence rather than arbitrary sentence counts. Concise correct content is valid.

## Training intelligence and substitutions

Program generation loads the canonical Supabase library before selection and validation. Training intelligence fails closed when canonical metadata is missing rather than consulting the old static catalog. Public substitutions come from reviewed `exercise_alternatives` edges joined back to canonical exercise records.

## Media

Canonical records expose media provenance. The UI resolves approved self-hosted provider media by stable slug; media validation remains part of the production release gate.

## Imports and updates

- Product/EL migrations before `20260929`: **HISTORICAL — NEVER REPLAY manually**. They exist to reconstruct a new database in migration order.
- `20260820161841_product_17_vital_library_expansion`: **SAFE IDEMPOTENT for exercise rows** (`ON CONFLICT (slug) DO NOTHING`), historical media ingestion.
- `20260929` integrity and prescription migrations: **ACTIVE CONTENT UPDATE**, idempotent database remediation.
- Ad-hoc provider/import scripts: **DEPRECATED for production writes** unless they produce a reviewed migration using stable IDs/slugs.
- `20260929231400_exercise_source_of_truth_remediation`: **ACTIVE ARCHITECTURE MIGRATION**.

Future updates must target a stable ID or slug, identify explicit fields, update `content_version`, `reviewed_at`, and `review_source`, and pass database integrity gates. Positional/index mapping is prohibited.

## Validation pipeline

1. Curate or import a draft record.
2. Validate semantics, movement prescription, substitutions, and media upstream.
3. Record per-field provenance and reviewer metadata.
4. Mark production-ready only after the database gate passes.
5. Run `pnpm audit:exercise-content` and `pnpm audit:exercise-rendering`.
6. Public and authenticated consumers return the same canonical guidance without request-time rewriting.

## Homepage rendering

The marketing homepage is a Server Component. `HomepageEntryGate` used browser auth and entry state to choose or redirect the experience; it no longer redirects authenticated visitors away from `/`. The server-rendered marketing body is always present, while auth only enhances client navigation and gateway behavior after hydration.
