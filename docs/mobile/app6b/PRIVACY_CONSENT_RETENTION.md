# Privacy, consent, and retention

- Explicit versioned consent is required before an upload intent.
- The bucket is private; object paths are scoped to the authenticated user and review ID.
- Upload authorization is short-lived and media playback uses a five-minute signed URL.
- Clips are limited to MP4/MOV, 75 MB, and 30 seconds.
- The member can independently delete the video and review metadata.
- Daily retention work tombstones records and removes media at 30 days.
- API responses and analytics contain no video bytes, signed media URLs, questions, or observations.

Production retention cannot be operationally verified until the additive migration is applied and the two-user suite is run.

