# Mobile V1 Screen Inventory

## Public and authentication

| Screen | Purpose | Key states |
|---|---|---|
| Assessment question | First-launch experience with real branched question | saved/offline, validation, safety exit |
| Assessment resume | Resume local or emailed session | expired, conflict, migrated version |
| Optional progress photos | Consent and private staging | permission denied, queued, delete |
| Blueprint | Personalized preview and account CTA | partial, ready, generation failure |
| Create account | Email/password plus legal acceptance | existing user, verification required |
| Sign in | Password and magic link | invalid, rate-limited, offline |
| Verify/deep-link callback | Complete email flow and claim | duplicate, expired, wrong device |
| Forgot/reset password | Native recovery | link return and success |

## Member navigation

| Screen | Purpose | Key states |
|---|---|---|
| Today | Single next action, workout/check-in/review, nutrition summary | new, rest day, overdue, offline |
| Program overview | Current block, goal, schedule, adaptations | no program, regenerating |
| Program calendar | Month/week schedule and session detail | changed/skipped days |
| Nutrition plan | Targets, rationale, meal/supplement guidance | insufficient data, revised targets |
| Nutrition log | Daily intake/activity tracking | offline read, online mutation |
| Workout launch/resume | Select scheduled session and download snapshot | unavailable, stale snapshot |
| Active workout | Sets, load/reps/RIR, instructions, timer, swap, shorten | offline, sync pending/conflict |
| Workout completion | Summary, notes, local/server completion | queued, acknowledged |
| Workout history/detail | Past sessions and edits | amended session |
| Exercise library | Search/filter catalog | cached search, media unavailable |
| Exercise detail | Instructions, anatomy, alternatives, provider video | stream failure, rights-based no video |
| Weekly check-in | Recovery/adherence inputs and result | due/not due, saved offline draft |
| Progress dashboard | Trends and evidence thresholds | empty/1 point/3+ points |
| Monthly review | Review cycle, recommendation, decision | not due, pending, accepted/rejected |
| Progress photos | Capture/upload/timeline/delete | private, queued, failed |
| Coach | Conversation and suggested actions | trial-ended, offline, safety escalation |
| Coach action review | Explicit accept/reject before plan change | stale proposal, success |
| Account | Profile, units, notifications, privacy | loading/error |
| Subscription | Trial/access, purchase/restore/manage | grace, revoked, provider-specific |
| Export and deletion | Request/status/confirm and store cancellation guidance | pending/completed |
| Sync center | Pending, failed, conflict operations | retry, resolve, contact support |

## Web-only in V1

Homepage, pricing comparison/editorial pages, methodology, FAQ, contact, articles/insights, social sharing studio, public calculators, administration, exercise ingestion/production, SEO tooling, and provider-media review remain on the responsive website. Native may open relevant web URLs rather than duplicate them.

## Accessibility and empty-state rule

Every screen needs loading, empty, offline, expired-access, recoverable error, and destructive confirmation states where applicable. Empty states must give one useful next action. Dynamic type, screen-reader order, focus return, reduced motion, contrast, and large touch targets are acceptance criteria, not polish.
