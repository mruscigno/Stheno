# Video processing architecture

1. An authenticated eligible member requests a signed upload URL for one MP4/MOV clip (50 MB and 30 seconds maximum).
2. Supabase stores the object in the private `coach-form-videos` bucket under `user-id/review-id`.
3. Submission verifies ownership, bytes, container signature, duration, quota, and processing authorization.
4. A service-role worker atomically claims queued jobs with `FOR UPDATE SKIP LOCKED` and a short lease.
5. Bundled FFmpeg decodes the video, verifies codec/duration, and extracts at most 12 metadata-free JPEG frames across the full clip. Audio is never selected or transmitted.
6. OpenAI receives low-detail sampled frames plus one reviewed App 6A rubric. Zod validates output; checkpoint IDs and timestamps are checked against supplied evidence.
7. The worker writes the result only while its lease and processing status still match. Temporary input and frames are removed in `finally` cleanup.

No member-provided URL is fetched. The worker downloads only the known private object path.

