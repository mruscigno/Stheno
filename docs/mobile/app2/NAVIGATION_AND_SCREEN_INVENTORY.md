# Navigation and screen inventory

| Route | State | App 2 behavior |
|---|---|---|
| `/` | public/loading | splash, exact assessment question, sign-in entry |
| `/sign-in` | public | password sign-in |
| `/forgot-password` | public | neutral reset request |
| `/auth/callback` | deep link | verification/recovery exchange |
| `/auth/reset` | recovered session | password update |
| `/verify-email` | public | verification instructions |
| `/resume` | signed-in incomplete | honest App 3 handoff |
| `/membership` | signed-in no access | web plan route; no mobile billing |
| `/offline` | recovery | offline guidance |
| `/(member)` | entitled | live read-only Today |
| `/plan`, `/progress`, `/coach` | entitled | honest future placeholders |
| `/more` | entitled | explicit sign-out |
