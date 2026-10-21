# Retention and deletion results

The retention implementation deletes the private object first, then tombstones the review and clears structured feedback and member question. Worker persistence is guarded by lease/status, so a deletion that wins prevents a late result write. Temporary decode files are removed in a `finally` block.

Unit coverage verifies successful physical-object cleanup and that a storage failure does not falsely tombstone the database row. A real 30-day scheduler run against isolated Storage remains required for private-pilot activation.

