# Entitlement and rollout audit

Normal trial/subscription access remains mandatory. Native workout access adds a second server-side decision:

1. `DISABLED`: nobody is enabled.
2. `INTERNAL_TEST`: only active `internal_test` members are enabled.
3. `LIMITED_PILOT`: explicit `internal_test` or `limited_pilot` members are enabled.
4. `PUBLIC`: prohibited and fail-closed in App 5B-2V.

Members can read global state and only their own cohort record. They cannot insert, update or delete either table. Service-role administration is required. Cohort dates are enforced. Missing schema/query failures fail closed. The mobile capability is explanatory UI only; every native mutation repeats authorization on the server.

The immediate kill switch is:

```sql
update public.feature_rollout_controls
set state = 'DISABLED', updated_at = now(), updated_by = null
where feature_key = 'native_workout';
```

Turning the switch off does not delete SQLite operations. Pending native operations remain locally durable and can reconcile after authorized service restoration.
