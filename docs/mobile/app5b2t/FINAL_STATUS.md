# App 5B-2T final status

- Baseline commit: `11f1ef653e57a94d369d026bb88d7dd69a4ca645`.
- Final tested implementation commit: `fae33f492bde8fd49706fa21b3bca2660b52e786`.
- Fresh current APK SHA-256: `1088da0d2712f81323e1da123c84d52ee2218d15096ee6b941fc52c860c98b02`.
- GitHub Actions run/job: [run 40922283448](https://github.com/mruscigno/Stheno/actions/runs/40922283448), [API-35 job](https://github.com/mruscigno/Stheno/actions/runs/40922283448/job/123618434421) — **passed**.
- Local tests: accessibility 1/1; assessment fixture 45/45; mobile 22/22; full repository 245/245; focused protocol/invariant 4/4; mobile lint/typecheck passed; 147-page production build passed.
- Failed step: none in the passing run. Scenarios F-H remain incomplete as genuine device scenarios and repeatability is not yet established on a second final-commit run.
- Production deployment: **NOT DEPLOYED**, required by package guardrail.
- Native activation flag: **OFF**.
- iOS: **UNVALIDATED / OUT OF SCOPE**.

## Verdict

**BLOCKED** — A-E and I pass, but do not claim **GO FOR ANDROID WORKOUT GATE** until genuine Android F-H evidence and the required repeatability run exist.

