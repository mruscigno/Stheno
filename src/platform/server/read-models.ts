import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { evaluateMemberAccess } from "@/modules/access/trial";

export async function memberReadModel(db: SupabaseClient, user: User) {
  const [profile, preferences, subscription, entitlements] = await Promise.all([
    db.from("profiles").select("display_name,lifecycle_state,time_zone,created_at,updated_at").eq("user_id", user.id).maybeSingle(),
    db.from("user_preferences").select("unit_system,locale").eq("user_id", user.id).maybeSingle(),
    db.from("subscriptions").select("status,billing_interval,current_period_ends_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("entitlements").select("entitlement_key,active,starts_at,ends_at").eq("user_id", user.id).eq("active", true),
  ]);
  if (profile.error || preferences.error || subscription.error || entitlements.error) throw new Error("MEMBER_READ_FAILED");
  return {
    id: user.id,
    email: user.email ?? null,
    profile: profile.data,
    preferences: preferences.data,
    access: evaluateMemberAccess({ accountCreatedAt: user.created_at, subscriptionStatus: subscription.data?.status }),
    subscription: subscription.data,
    entitlements: entitlements.data ?? [],
  };
}

export async function programReadModel(db: SupabaseClient, userId: string) {
  const { data, error } = await db.from("program_prescriptions").select("id,program_id,profile_snapshot_id,assessment_id,prescription,validation_result,engine_version,ruleset_version,prescribed_at").eq("user_id", userId).order("prescribed_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`PROGRAM_READ_FAILED:${error.message}`);
  return data;
}

export async function nutritionReadModel(db: SupabaseClient, userId: string) {
  const [nutrition, activity, preferences, supplements] = await Promise.all([
    db.from("nutrition_targets").select("*").eq("user_id", userId).order("effective_from", { ascending: false }).limit(1).maybeSingle(),
    db.from("activity_targets").select("*").eq("user_id", userId).order("effective_from", { ascending: false }).limit(1).maybeSingle(),
    db.from("nutrition_preferences").select("*").eq("user_id", userId).maybeSingle(),
    db.from("user_supplements").select("state,supplement_profiles(slug,name,purpose,evidence_grade,guidance,safety_note)").eq("user_id", userId),
  ]);
  if (nutrition.error || activity.error || preferences.error || supplements.error) throw new Error("NUTRITION_READ_FAILED");
  return { nutrition: nutrition.data, activity: activity.data, preferences: preferences.data, supplements: supplements.data ?? [] };
}

export async function progressReadModel(db: SupabaseClient, userId: string) {
  const [reviewState, reviews, recommendations, checkins, photoSets] = await Promise.all([
    db.from("member_review_state").select("*").eq("user_id", userId).maybeSingle(),
    db.from("monthly_reviews").select("id,period_start,period_end,due_at,started_at,completed_at,status,structured_assessment").eq("user_id", userId).order("due_at", { ascending: false }).limit(24),
    db.from("monthly_recommendations").select("*").eq("user_id", userId).order("decided_at", { ascending: false }),
    db.from("weekly_checkins").select("id,week_start,weight_lb,workout_adherence,nutrition_adherence,energy,sleep,hunger,stress,soreness,difficulty,pain,schedule_changed,submitted_at").eq("user_id", userId).order("week_start", { ascending: false }).limit(52),
    db.from("progress_photo_sets").select("id,baseline,captured_at,views,monthly_review_id,completed_at").eq("user_id", userId).not("completed_at", "is", null).order("captured_at", { ascending: false }),
  ]);
  if (reviewState.error || reviews.error || recommendations.error || checkins.error || photoSets.error) throw new Error("PROGRESS_READ_FAILED");
  return { state: reviewState.data, reviews: reviews.data ?? [], recommendations: recommendations.data ?? [], checkins: checkins.data ?? [], photoSets: photoSets.data ?? [] };
}

export async function todayReadModel(db: SupabaseClient, userId: string) {
  const [active, program, review, nutrition] = await Promise.all([
    db.from("workout_execution_sessions").select("id,workout_key,status,original_workout,revised_workout,current_exercise_index,started_at,updated_at").eq("user_id", userId).in("status", ["active", "paused"]).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    programReadModel(db, userId),
    db.from("member_review_state").select("next_monthly_review_at,monthly_review_due,monthly_review_status").eq("user_id", userId).maybeSingle(),
    db.from("nutrition_targets").select("calories_kcal,protein_g,carbohydrate_g,fat_g,effective_from").eq("user_id", userId).order("effective_from", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (active.error || review.error || nutrition.error) throw new Error("TODAY_READ_FAILED");
  return { activeWorkout: active.data, program, review: review.data, nutrition: nutrition.data };
}
