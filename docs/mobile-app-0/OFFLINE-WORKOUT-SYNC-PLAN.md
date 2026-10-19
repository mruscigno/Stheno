# Offline Workout Sync Plan

## Guarantee

Once a workout is opened online, the user can log, edit, skip, substitute, time, and complete that session without connectivity. Reconnect never discards a confirmed user entry and never double-counts a set or completion.

## Local model

Use SQLite tables for workout snapshots, set state, substitutions, session state, and an append-only outbox. Every mutation has:

- `operationId` UUID generated once and reused on retries.
- account, device, session, and entity identifiers.
- operation type and validated payload.
- `clientRevision`, `baseServerRevision`, and client timestamp.
- pending/sending/acknowledged/failed state, attempts, and last error.

Timer state is derived from start/end timestamps, not an in-memory decrementing counter. The active workout is restored after process death.

## Server protocol

- Accept ordered batches with a size limit and bearer authentication.
- Store a unique receipt by user and `operationId`; duplicate delivery returns the prior result.
- Apply operations transactionally per logical entity and return server revision/current state.
- Recompute derived statistics, completion, adaptations, and progress server-side.
- Support tombstones for removals; absence is not deletion.
- Retain enough receipts/revisions to cover realistic offline periods and app upgrades.

## Conflict rules

1. A later explicit user edit wins over an earlier edit to the same field when its monotonic client revision follows the acknowledged lineage.
2. Concurrent device edits return `CONFLICT` with both values; the app asks the user when intent cannot be inferred.
3. Prescriptions and exercise targets are immutable session snapshots. Later program adaptations do not rewrite an active workout.
4. Server-derived totals and progress are always recomputed from accepted logs.
5. Completion is idempotent and may be amended through an explicit reopen/edit operation, not a second completion.
6. Account sign-out pauses and encrypts or deletes private queued data; it must never sync under a different user.

## UX

Show `Saved on this device`, `Syncing`, `Synced`, and `Needs attention`. Do not block logging because a request is pending. Completion can succeed locally; clearly state that insights/adaptations will appear after sync. Provide retry and conflict resolution without exposing technical errors.

## Scope

Offline V1 covers a downloaded/opened workout, not the entire program, Coach, billing, or fresh program generation. Exercise instructions needed by the active session can be cached. Videos remain streamed unless native/offline rights are explicitly granted.

## Failure testing

- Airplane mode before and during a set, completion, or substitution.
- Termination/restart with a running timer and pending operations.
- Duplicate/reordered batches, timeout after server commit, and retry days later.
- Simultaneous phone/tablet edits, plan adaptation during an offline session, revoked access, token refresh, clock skew, app upgrade, and sign-out/account switch.
- Database migrations with queued old-version operations.

The existing client session and set idempotency constraints are building blocks, not proof of this guarantee. App 4A cannot ship until destructive network testing demonstrates zero lost or duplicated sets.
