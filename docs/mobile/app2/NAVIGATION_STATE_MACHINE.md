# Navigation state machine

| State | Destination |
|---|---|
| Session loading | branded secure-session screen |
| Signed out | first assessment question |
| Signed in + incomplete assessment lifecycle | `/resume` |
| Signed in + entitled | `/(member)` Today |
| Signed in + no access | `/membership` |
| API/bootstrap failure | retry/sign-out recovery state |

Member tabs are Today, Plan, Progress, Coach, and More. Only Today is a live App 2 read surface. Plan, Progress, and Coach explicitly say they are future deliveries and do not simulate functionality. More provides explicit sign-out.
