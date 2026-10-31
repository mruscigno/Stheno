# Limited pilot activation plan

Founder approval is required before either activation step.

1. Add real tester UUIDs using service-role administration; do not create production fixture accounts.
2. Set those rows to `internal_test`, active and optionally time-bounded.
3. Change the global state from `DISABLED` to `INTERNAL_TEST`.
4. Verify one authorized and one unauthorized real account; unauthorized mutations must return 403.
5. Observe at least 48 hours with no dead letters, duplicates, cross-account exposure or unresolved conflicts.
6. For a limited pilot, add explicit `limited_pilot` rows and change state to `LIMITED_PILOT`.

Abort immediately using the SQL in `ENTITLEMENT_AND_ROLLOUT_AUDIT.md`. `PUBLIC` cannot be activated by data alone in this release. Store submission and iOS activation are out of scope.
