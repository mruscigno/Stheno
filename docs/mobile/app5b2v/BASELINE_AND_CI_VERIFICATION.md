# Baseline and CI verification

- Accepted source commit: `87b5d79716926d1229ada554e0e8dcb9104d0666`.
- Android repeatability runs: [41209112654](https://github.com/mruscigno/Stheno/actions/runs/41209112654) and [41212983502](https://github.com/mruscigno/Stheno/actions/runs/41212983502).
- Verified APK SHA-256: `1088da0d2712f81323e1da123c84d52ee2218d15096ee6b941fc52c860c98b02`.
- Both artifacts contained five pass markers, genuine API-35 screenshots, matching source/APK hashes, and database assertions.
- Production deployment observed before this sprint: `dpl_ArqYu8uRpr2GQhRXdAaGGNb523rb`, source `dc69baa1038f0d6c1c872afb8255df28ef95afe5`.

Because this sprint changes the native visibility decision and mutation authorization, the complete Android suite must pass twice again on the final commit before activation readiness is declared.
