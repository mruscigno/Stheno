# Baseline and dependencies

App 3 builds on App 1 contracts and App 2 Expo/Supabase authentication. The canonical questionnaire is `src/modules/acquisition/assessment-model.ts` (version 4.0.0), not the older member assessment registry. Blueprint generation uses `createBlueprint`; profile and program generation reuse the existing assessment/training engines. Expo SecureStore retains only the session ID and capability. Elevated credentials remain server-only.
