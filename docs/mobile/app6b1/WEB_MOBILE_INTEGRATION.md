# Web and mobile integration

Web and Expo share the same signed-upload and review APIs. Web renders queued, completed, abstained, failed, delete, and limitation states and can attach the owner-scoped review to Ask Coach. Expo selects and previews a recorded video, presents the same consent, uploads privately, polls the same review endpoint, and renders structured feedback.

Both surfaces remain hidden unless their respective feature flags allow access. Expo source/type/export validation is not native iOS or Android runtime proof.

