# Auth redirect verification

Static configuration and automated tests pass:

- development scheme: `stheno-dev`;
- production scheme: `stheno`;
- Android intent filters cover `/auth/mobile` and `/auth/callback` on `www.sthenofitness.com`;
- iOS associated domain remains `applinks:www.sthenofitness.com`;
- mobile deep-link, navigation-state, and assessment-entry tests passed in the 11-test mobile suite.

Native browser-to-app delivery and post-restart session restoration remain unverified because the emulator did not boot. No statement of end-to-end auth completion is made.
