# App 5B-1 executive summary

App 5B-1 integrates the App 5A atomic workout protocol into both the mobile-safe v1 routes and the existing cookie-authenticated web workout adapter. Start/resume, set creation/edit, reviewed substitution, and completion now share one PostgreSQL transaction boundary for the aggregate mutation, receipt, revision, and outbox event. The privileged implementation was moved to the non-exposed `private` schema; the Data API exposes only a least-privilege security-invoker adapter.
