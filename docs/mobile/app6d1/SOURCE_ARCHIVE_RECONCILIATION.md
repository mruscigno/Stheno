# Source archive reconciliation

## Reconciled sources

| Logical source | Manifest records | Available form | Result |
|---|---:|---|---|
| Bodybuilding | 797 | original ZIP | complete; ZIP opened and all entries hashed |
| Calisthenics | 122 | original ZIP | complete; ZIP opened and all entries hashed |
| functional.zip | 115 | aggregate Functional Training ZIP | complete by filename and uncompressed-size reconciliation |
| functional 2.zip | 91 | aggregate Functional Training ZIP | complete by filename and uncompressed-size reconciliation |
| premium gifs.zip | 94 | aggregate Premium Exercise ZIP | complete by filename and uncompressed-size reconciliation |
| premium2.zip | 224 | aggregate Premium Exercise ZIP | complete by filename and uncompressed-size reconciliation |
| premium 3.zip | 88 | aggregate Premium Exercise ZIP | complete by filename and uncompressed-size reconciliation |
| Module 1 | 52 | extracted folder only | 51 in module folder; the missing named MP4 exists in the premium folder |
| Module 2 | 8 | extracted folder only | one PDF missing |
| Module 3 | 1 | extracted folder only | complete |
| Module 4 | 5 | extracted folder only | complete |
| Module 5 | 2 | extracted folder only | complete |

The only unavailable manifest record is `asset-1587`, the long-named `PLANILHAFEMININA031...pdf` in Module 2 (718,249 bytes). Original module ZIPs were not available, so ZIP CRC/container integrity cannot be independently re-run for Modules 1–5. Extracted available files were hashed directly.

The audit used read-only streaming. It did not extract into the repository, upload assets, alter production, or modify the canonical catalog.
