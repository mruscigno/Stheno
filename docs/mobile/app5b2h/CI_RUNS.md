# CI runs

## Final gate

- Run: [40414407657](https://github.com/mruscigno/Stheno/actions/runs/40414407657)
- Job: `121892974075`
- Source: `c6d25f74adce7f1374237d8012104d89ab62d6e4`
- Result: passed in 36m34s.

## Evidence-led remediation runs

- `39904185232`: retained baseline; exposed the original claim/bootstrap dependency cycle.
- `40374626798`: exposed stale callback URL handling in an already-running app.
- `40380852583`: exposed the missing active `4.0.0` assessment-version registry row.
- `40387031343`: invalid assertion construction; migration itself had applied.
- `40387584575`: proved claim, then exposed missing Web Crypto UUID support in Hermes. One transient NDK archive failure was rerun.
- `40393587739`: proved member APIs and Today, then exposed Android system-navigation overlap.
- `40399228099`: proved safe-area layout, then exposed the debug warning overlay intercepting Plan navigation.
- `40404541555`: confirmed the overlay still intercepted the tab edge.
- `40409508440`: captured the real Program and exposed cold-start routing to the anonymous entry despite a restored session.
- `40414407657`: passed all gates.

Local validation: mobile typecheck, 5 test files/14 tests, mobile lint, targeted platform tests, root web lint/typecheck/tests/build, and exercise/workout invariants all passed. Web lint retained eight pre-existing warnings and zero errors.

