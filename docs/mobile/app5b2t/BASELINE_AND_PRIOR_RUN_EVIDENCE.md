# Baseline and prior-run evidence

- Baseline implementation: `11f1ef653e57a94d369d026bb88d7dd69a4ca645`.
- Run [40794655253](https://github.com/mruscigno/Stheno/actions/runs/40794655253) built APK SHA-256 `1088da0d2712f81323e1da123c84d52ee2218d15096ee6b941fc52c860c98b02`, then failed at `assessment-input-specificOutcome` before the workout path.
- Run [40790540383](https://github.com/mruscigno/Stheno/actions/runs/40790540383) used the same APK, completed onboarding, program loading, the online set, two offline sets, and the first offline process restart. It restored Set 1 `50/8/2`, Set 2 `55/6/3`, and Set 3 defaults for the same owner.
- Its failure hierarchy recorded Set 2 with inverted clipped bounds `[202,2225][393,2130]`; logcat recorded repeated `Input event injection ... failed`; the harness nevertheless treated the node as tappable and exhausted text retries.

