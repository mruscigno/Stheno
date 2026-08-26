# Product 20 performance record

Production baseline measured August 26, 2026 with five uncached HTTP requests from the development workstation:

| Route | Samples (seconds) | Median |
| --- | --- | --- |
| `/` | 0.271, 0.201, 0.187, 0.167, 0.176 | 0.187 s |
| `/pricing` | 0.211, 0.211, 0.207, 0.208, 0.207 | 0.208 s |

Target: keep median time to first byte below 0.8 seconds. The authenticated proof queries do not run on public pages. The homepage traction query is cached for one hour and renders nothing below its integrity threshold.

Post-deployment measurements are appended after production promotion.

Production verification after promotion:

| Route | Samples (seconds) | Median |
| --- | --- | --- |
| `/` | 0.200, 0.184, 0.225, 0.207, 0.185 | 0.200 s |
| `/pricing` | 0.204, 0.190, 0.173, 0.179, 0.185 | 0.185 s |

Both medians remain well below the 0.8-second target. All release routes returned HTTP 200.
