# Conflict matrix

| Case | Expected result | Evidence |
|---|---|---|
| Same operation replay | Existing receipt; no duplicate | Existing App 5A pgTAP + Android database assertion |
| Stale revision | Local session and operation marked `conflict` | Unit policy test + server protocol tests |
| Timeout after commit | Receipt lookup commits local acknowledgement | Sync implementation and Android reconnect gate |
| Repeated local set edit | Ordered stable operations update one stable set ID | SQLite design + server unique constraints |
| Completion with missing sets | Explicit `allowIncomplete`; no hidden loss | UI completion path + server confirmation rule |
| Two users on one device | Composite owner keys; no cross-user reads | Schema inspection + two-user backend security matrix |

Final device results are recorded by the Android CI gate, not inferred locally.
