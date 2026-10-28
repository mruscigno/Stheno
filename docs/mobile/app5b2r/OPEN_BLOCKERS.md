# Open blockers

1. **Android offline authenticated bootstrap.** Run `40756034444` passes real authentication, claim, Program, online workout and offline set persistence, then stalls after force-stop while offline at `Restoring your private assessment…`. Owner: mobile platform. Next action: add a versioned user-scoped offline bootstrap cache/state, use `session.user.id` for local workout ownership, reopen the active local workout offline, and rerun the same gate through replay/conflict/completion/history.
2. **Remaining native lifecycle proof.** Ordered replay, duplicate idempotency, stale-revision conflict UI, completion/history and online cold restart were not reached. Owner: mobile release engineering after blocker 1.
3. **iOS runtime validation** remains a separate release blocker.

No user action is required. Production activation remains off.
