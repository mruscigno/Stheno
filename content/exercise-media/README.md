# Exercise media production pipeline

Exercise media is generated and reviewed offline. Runtime pages never call a generation provider.

1. Create a brief matching `brief.schema.json`.
2. Generate one or more candidate assets outside the application.
3. Record technical movement review, anatomy review, and brand/visual review.
4. Only copy an approved export into the production media store.
5. Update the exercise provenance/version record and set every review state to `reviewed`.
6. Set `prescribable` and `public_indexable` only after the content gate passes.

Generated candidates are drafts. They cannot be published merely because generation completed. If motion is unreliable, approve an exercise-specific start/end illustration plus anatomy map and beginner instructions instead.

