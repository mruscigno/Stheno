create index if not exists monthly_recommendations_user_idx
  on public.monthly_recommendations (user_id);
create index if not exists monthly_reviews_prior_review_idx
  on public.monthly_reviews (prior_review_id);
create index if not exists progress_photo_sets_assessment_idx
  on public.progress_photo_sets (assessment_id);
create index if not exists progress_photo_sets_monthly_review_idx
  on public.progress_photo_sets (monthly_review_id);
create index if not exists progress_photo_views_user_idx
  on public.progress_photo_views (user_id);
create index if not exists visual_observations_user_idx
  on public.visual_observations (user_id);
create index if not exists visual_observations_photo_set_idx
  on public.visual_observations (photo_set_id);
create index if not exists visual_observations_comparison_set_idx
  on public.visual_observations (comparison_photo_set_id);
