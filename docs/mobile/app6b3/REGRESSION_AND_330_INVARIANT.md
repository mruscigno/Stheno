# Regression and library invariants

Required invariants:

- exactly 330 canonical exercise IDs;
- exactly 298 purchased media mappings;
- the five reviewed form rubrics remain limited to Goblet Squat, Barbell Romanian Deadlift, Lat Pulldown, Dumbbell Bench Press, and One-Arm Dumbbell Row;
- no claim of form-analysis support for the full exercise library;
- Assessment, Blueprint, accounts, Stripe, workouts/outbox, Nutrition, Coach safety, private progress photos, monthly reviews, and mobile API contracts remain unchanged.

Verified by `src/platform/contracts/exercise-baseline.test.ts` in the passing 244-test root suite:

- 330 unique canonical IDs;
- canonical digest `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b`;
- 298 purchased media mappings.

No exercise catalog, media manifest, Assessment, Blueprint, Stripe, workout, Nutrition, progress, monthly-review, or mobile contract file was changed.
