# Executive summary

App 5B-2S separates persisted Supabase identity from online member read-model availability. A previously authenticated device may open only that identity's locally persisted workout while offline; reconnect still requires normal Supabase/API validation before replay.

Baseline: `204c4941bab94223fb08c428ce7d18e4abfb3638`. The final commit and native evidence are pending the fresh Android gate.
