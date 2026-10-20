# Defects and fixes

| Defect | Severity | Resolution |
| --- | --- | --- |
| HTTPS auth links could open `/auth/mobile`, a missing native route | High | Added an explicit route alias and permitted both supported HTTPS paths |
| Local AVD remains offline in ADB | Gate blocker | Not a product-code defect; requires physical hardware or another emulator host |
| Native CMake build loops in `react-native-worklets` on this Windows host | Gate blocker | Java worker issue mitigated; native issue remains reproducible |
| No isolated STHENO staging backend | Security gate blocker | Requires a staging Supabase project/branch and synthetic fixtures |

No unrelated product behavior or App 5 work was added.
