# API capability matrix

| Capability | Endpoint | App 4 use |
|---|---|---|
| Member | `GET/PATCH /api/v1/me` | Account and preferences |
| Today | `GET /api/v1/today` | Daily overview |
| Program | `GET /api/v1/program` | Plan and schedule |
| Nutrition | `GET /api/v1/nutrition` | Targets and guidance |
| Progress | `GET /api/v1/progress` | Honest App 6 boundary |
| Coach | `GET/POST /api/v1/coach/questions` | History and questions |
| Adaptation | `POST /api/v1/adaptations/preview` | Deterministic preview |
| Decision | `POST /api/v1/adaptations/decision` | Explicit confirm/cancel |

All member endpoints require the Supabase bearer identity and preserve database RLS.
