create index nutrition_entries_copied_from_idx on public.nutrition_entries(copied_from_entry_id) where copied_from_entry_id is not null;
create index nutrition_daily_summaries_target_idx on public.nutrition_daily_summaries(target_id) where target_id is not null;
create index saved_meals_owner_idx on public.saved_meals(user_id);
create index saved_meal_items_owner_idx on public.saved_meal_items(user_id);
