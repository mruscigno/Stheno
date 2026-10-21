# Processing worker report

The worker retains lease-token guarded writes, skip-locked claiming, bounded retries, terminal states, deletion-race protection, and owner-scoped result persistence. The production model default and prices now match the verified model.

The controlled Vercel evaluation exposed a deployment blocker: `ffmpeg-static` was not included in the function bundle and the first two decode attempts failed with `ENOENT`. Additional output-tracing globs were added, but a fresh deployed worker decode check is still required before private-pilot activation. No cron schedule or processing flag is enabled.

