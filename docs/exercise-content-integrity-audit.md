# Exercise content integrity audit

Generated: 2026-09-29T20:28:21.573Z
Production exercises: **567**
Audited: **567**
Passed: **567**
Failed: **0**
Warnings: **0**
Movement-type conflicts: **0**
Placeholder/template copy: **0**
Substitution edges: **2018** total / **0** flagged
Media relations: **298** / **0** problems

## Severity policy

Critical schema, prescription, semantic, substitution-graph, or media-reference failures block publication and CI. Missing optional licensed video does not fail because instruction-only pages are intentional.

## Issues

| Exercise | Code | Severity | Message |
|---|---|---|---|

## Stratified editorial sample

A 50-record sample was drawn deterministically across every movement type present in production. The review compared the name, purpose, movement type, pattern, prescription, setup, execution, cues, expected effort, and equipment.

The sample exposed three systemic edge cases before release: dynamic stretches classified as timed mobility, static balance poses classified as rep mobility, and shoulder raises inheriting vertical-pull mechanics from coarse source metadata. The correction migration fixed those classes across the corpus and replaced the remaining semantically generic “controlled strength and skill” purpose pattern. The audit was rerun after the corrections.

Final production distribution: 448 dynamic-rep exercises, 17 timed isometrics, 10 distance carries, 4 timed carries, 25 timed cardio exercises, 6 cardio intervals, 32 rep-based mobility drills, and 25 timed mobility drills. There are currently no exercises whose identity explicitly calls for `CARDIO_DISTANCE`; the supported type remains available rather than assigning distance arbitrarily.
