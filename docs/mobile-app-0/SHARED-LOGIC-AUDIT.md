# Shared Logic Audit

## Extraction rule

Share deterministic, environment-independent behavior. Keep authentication, authorization, persistence, billing verification, AI calls, email, storage signing, and derived-record orchestration on the server. The mobile client may predict presentation outcomes, but the server remains authoritative for programs, entitlements, adaptations, and progress.

## Recommended packages

| Package | Contents | Exclusions |
|---|---|---|
| `@stheno/domain` | Domain types, units, assessment definitions, calendar math, safe presentation calculations | Database clients, secrets, route handlers |
| `@stheno/contracts` | Versioned request/response/event DTOs and error codes | Supabase-generated table types as public API |
| `@stheno/validation` | Zod schemas and normalization shared at API/client boundary | Authorization decisions |
| `@stheno/api-client` | Typed bearer-auth HTTP client, retries, idempotency headers | Direct service-role or privileged Supabase calls |
| `@stheno/design-tokens` | Color, type, spacing, icon, motion, accessibility tokens | Web CSS components |

## Module disposition

| Existing capability | Action | Reason |
|---|---|---|
| Assessment question definitions and branching predicates | Extract | Must remain identical across web/mobile |
| Assessment persistence/claim | Server API | Ownership and exactly-once transfer |
| Unit conversions and display formatting | Extract | Pure and high parity value |
| Calendar/date calculations | Extract with timezone tests | Shared behavior; mobile date edge cases matter |
| Training selection/prescription/progression pure functions | Extract selectively | Reuse, but final generation remains server-authoritative |
| Program generation orchestration | Server API | Writes many related records and must not drift |
| Nutrition calculations and validation | Extract selectively | Client previews are useful; persisted targets are authoritative |
| Workout set validation, timer math, summaries | Extract | Needed during offline execution |
| Workout logging and completion | Server API + sync protocol | Conflict resolution and derived data |
| Adaptive coaching/monthly review pure evaluators | Extract selectively | Same rules, server owns actions and records |
| Coach prompt/tool execution | Server only | Secrets, safety, context, cost, auditability |
| Stripe/webhook logic | Server only | Secrets and signed provider events |
| Photo upload signing and deletion | Server only | Privacy, authorization, retention |

## Guardrails

1. Packages must not import Next.js, Node-only APIs, Supabase clients, filesystem modules, or React Native.
2. Every extracted rule needs parity fixtures that run in web, mobile, and server CI.
3. Version assessment schemas and stored answers; never silently reinterpret an old assessment with new rules.
4. Use generated API types only behind stable contracts. Database schema is not the mobile API.
5. Treat timestamps as ISO UTC at boundaries and carry the user's IANA timezone separately.
6. Server responses include contract version and resource revision where offline mutation is possible.
7. Do not copy modules into the mobile tree. Extract once or call the API.

## Migration sequence

1. Add workspace package paths without moving the web application.
2. Extract contracts, validation, units, and assessment definition first; prove the web build/tests remain unchanged.
3. Add characterization fixtures for program, nutrition, workout, and review calculations.
4. Extract only modules that pass environment checks and parity tests.
5. Add `apps/mobile` after package boundaries and CI are working.
6. Consider moving web to `apps/web` only as a later isolated change; a big-bang repository move adds no V1 user value.

## Success criteria

- No duplicated assessment question set or branching implementation.
- Same fixtures produce the same normalized values on web, server, and mobile.
- Mobile cannot create a final program, grant access, or invoke Coach without an authenticated server decision.
- Shared packages have no environment-specific imports and can be built independently.
