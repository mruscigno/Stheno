import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateNativeWorkoutRollout, type NativeWorkoutAccess, type NativeWorkoutRolloutState, type RolloutMember } from "./native-workout-rollout-policy";

export async function nativeWorkoutAccess(db: SupabaseClient, userId: string): Promise<NativeWorkoutAccess> {
  const [control, membership] = await Promise.all([
    db.from("feature_rollout_controls").select("state").eq("feature_key", "native_workout").maybeSingle(),
    db.from("feature_rollout_members").select("cohort,active,starts_at,ends_at").eq("feature_key", "native_workout").eq("user_id", userId).maybeSingle(),
  ]);
  if (control.error || membership.error || !control.data)
    return { enabled: false, state: "DISABLED", cohort: null, reason: "configuration_unavailable" };
  return evaluateNativeWorkoutRollout(control.data.state as NativeWorkoutRolloutState, membership.data as RolloutMember | null);
}

export type { NativeWorkoutAccess, NativeWorkoutRolloutState } from "./native-workout-rollout-policy";
