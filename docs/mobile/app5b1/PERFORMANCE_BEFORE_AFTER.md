# Performance before and after

Core workout mutations replace multiple client-to-database round trips with one RPC for lock, write, revision, receipt, and outbox. Receipt lookup uses the unique `(user_id, operation_id)` index. Session locking uses the primary key plus owner predicate. Isolated lint/advisor output and representative CI duration are release evidence; production latency is not claimed before deployment.
