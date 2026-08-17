# ADR 0003: Deterministic training intelligence

Product 3 converts Personalization Profile `1.0.0` into an immutable, validated resistance-training prescription. Core programming is deterministic and uses engine `1.0.0` with ruleset `2026.08-v1`; no LLM participates in split, exercise, volume, rep, effort, rest, progression, substitution, or reconstruction decisions.

Methodology values live in typed configuration. Exercise candidates must pass production validation and carry equipment, movement, muscle, progression, fatigue, education, provenance, and review metadata. The initial library contains 20 original, reviewed entries. It is intentionally smaller than the launch aspiration because unreviewed bulk content is prohibited.

`program_prescriptions` stores the immutable Product 4 handoff. Product 4 may render and execute it but must not reimplement the training rules. Replacement and schedule proposals preserve reason codes, scope, versions, and confirmation state.
