# App 5B-2T final status

- Baseline commit: `11f1ef653e57a94d369d026bb88d7dd69a4ca645`.
- Stabilization commit: `d75beabc6894b77e68f3fe448d9abac07a7bc669`.
- Fresh current APK SHA-256: `1088da0d2712f81323e1da123c84d52ee2218d15096ee6b941fc52c860c98b02` (run `40888006569`; next corrected run pending).
- GitHub Actions: [run 40884720428](https://github.com/mruscigno/Stheno/actions/runs/40884720428) failed at invalid numeric fixture; [run 40888006569](https://github.com/mruscigno/Stheno/actions/runs/40888006569) failed at a valid assessment control excluded by the initial viewport threshold; [run 40891861003](https://github.com/mruscigno/Stheno/actions/runs/40891861003) completed the full native UI journey but the post-journey SQLite archive used the wrong Expo path.
- Local tests: accessibility 1/1; assessment fixture 45/45; mobile 20/20; focused root protocol/invariant 4/4; typecheck passed.
- Failed step: corrected SQLite evidence rerun pending.
- Production deployment: **NOT DEPLOYED**, required by package guardrail.
- Native activation flag: **OFF**.
- iOS: **UNVALIDATED / OUT OF SCOPE**.

## Verdict

**BLOCKED** — do not claim GO until every Android A-I gate and repeatability requirement has genuine evidence.

