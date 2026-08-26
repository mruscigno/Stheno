# Product 20 performance record

Production baseline measured August 26, 2026 with five uncached HTTP requests from the development workstation:

| Route | Samples (seconds) | Median |
| --- | --- | --- |
| `/` | 0.271, 0.201, 0.187, 0.167, 0.176 | 0.187 s |
| `/pricing` | 0.211, 0.211, 0.207, 0.208, 0.207 | 0.208 s |

Target: keep median time to first byte below 0.8 seconds. The authenticated proof queries do not run on public pages. The homepage traction query is cached for one hour and renders nothing below its integrity threshold.

Post-deployment measurements are appended after production promotion.
