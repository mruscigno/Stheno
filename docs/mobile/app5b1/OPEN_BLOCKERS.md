# Open blockers

1. Production migration history has substantial local/remote drift: many historical migrations exist under different timestamps, while App 5A (`20261020180318`) and App 5B-1 (`20261020192810`) are local-only. Blind `db push` is unsafe and prohibited by the release gate.
2. App 5A outbox consumption is not yet a deployed durable worker; existing synchronous derived calculations remain guarded by database uniqueness but are outside the aggregate transaction.
3. Native workout UI remains gated by the real Android Assessment → Blueprint → Account → Program walkthrough.
