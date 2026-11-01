# Shared web/mobile API parity

The shared `ExerciseDetailReadModel` now returns both `media` (the highest-ranked backwards-compatible item) and `mediaGallery` (up to six reviewed items). The server resolver ranks active, approved links and resolves primary demonstrations, alternate angles, comparisons, and technique tips from the same tables for both clients.

Website exercise pages and the native in-workout exercise guide use the same resolver. Both preserve the existing Vital fallback when the flag is off, a query fails, a derivative is missing, or CDN delivery is not configured. Supplemental media is clearly labeled and never impersonates a new canonical exercise.

The native guide remains a pushed route. Returning with the stable back control does not recreate or clear the workout screen, set entries, outbox, or timers. Media is optional while offline; written instructions remain available from the shared exercise model.
