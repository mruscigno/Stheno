# Staging seed and teardown

## Planned synthetic seed

- two unique test auth users (A and B);
- one anonymous assessment session per user;
- claimed blueprint, program, workout session, nutrition record, progress record, monthly review, Coach thread, and progress-photo object per user;
- deterministic fixture identifiers prefixed `app46_`.

## Teardown order

1. Delete synthetic storage objects.
2. Delete synthetic application rows in dependency order.
3. Delete the two synthetic auth users.
4. Delete or pause the ephemeral staging branch/project.

No seed or teardown was executed because no isolated environment existed. The plan deliberately excludes production customer data.
