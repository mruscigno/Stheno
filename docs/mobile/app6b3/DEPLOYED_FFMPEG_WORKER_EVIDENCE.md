# Deployed FFmpeg worker evidence

Temporary preview deployment: `dpl_B2ofabcyAzWo3s7gB128rw8i5TQH` (deleted after testing).

An authenticated, temporary Node route invoked the same `decodeAndSampleVideo` function used by the worker. A purchased repository H.264 animation was posted to the Vercel deployment.

Observed result:

- HTTP 200;
- Node runtime `v24.22.1`;
- FFmpeg executable resolved: yes;
- codec: H.264;
- duration: 12 seconds;
- 12 timestamped JPEG frames extracted;
- all 12 SHA-256 frame digests were distinct;
- server processing time: 850 ms.

The temporary endpoint, preview environment secret, and deployment were removed. No private/member media or provider call was involved.

This resolves the deployed-binary/frame-extraction question. The complete private upload → isolated database claim → provider → Coach follow-up → cleanup path remains unproven because no durable remote staging Supabase environment exists and production migrations are prohibited.
