# CI topology

GitHub Ubuntu runner hosts local Supabase Auth/Postgres/Storage and the real Next.js API. Android API 35 x86_64 reaches the API at `10.0.2.2:3000` and Supabase at `10.0.2.2:54321`. The APK is generated and compiled from the checked-out commit, installed with ADB, and driven through native UI Automator. Production project `svtmyxbjlbfmtysqqqwt` is used only as a deny-list assertion and is never contacted.
