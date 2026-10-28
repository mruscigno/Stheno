# Two-user isolation

Every local workout/session/set/outbox/receipt query remains partitioned by `user_id`. Offline bootstrap obtains that ID only from the encrypted persisted Supabase session. Switching accounts changes the partition key; A's pending operations are not selected or replayed for B. Sign-out retains pending data instead of deleting it.

The isolated backend ownership matrix and final native/account-switch evidence are pending the fresh CI run.
