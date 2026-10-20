# Redirect and authentication results

One valid defect was found and fixed:

- Android HTTPS intent handling was configured for `/auth/mobile`, but Expo Router only implemented `/auth/callback`.
- A new `/auth/mobile` route now delegates to the callback screen.
- Android intent filters now allow both `/auth/mobile` and `/auth/callback` on `www.sthenofitness.com`.
- Tests cover `stheno-dev://`, `stheno://`, and HTTPS callback forms while rejecting untrusted hosts and invalid OTP types.

Automated parsing tests pass. End-to-end verification-email and password-reset delivery remain blocked pending a booted native Android runtime and safe staging Auth configuration.
