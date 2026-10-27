import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const rid = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(rid, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(rid, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const { id } = await context.params;
  const db = authorization.context.db, userId = authorization.context.user.id;
  const [session, sets] = await Promise.all([
    db.from("workout_execution_sessions").select("id,workout_key,status,original_workout,revised_workout,current_exercise_index,revision,started_at,updated_at").eq("id", id).eq("user_id", userId).is("deleted_at", null).maybeSingle(),
    db.from("workout_set_logs").select("id,exercise_slug,set_ordinal,set_type,prescribed,load_value,load_unit,repetitions,rir,rpe,state,performed_at,revision").eq("workout_execution_session_id", id).eq("user_id", userId).is("deleted_at", null).order("performed_at", { ascending: true }),
  ]);
  if (session.error || sets.error) return apiError(rid, 503, "SERVICE_UNAVAILABLE", "Workout could not be loaded.");
  if (!session.data) return apiError(rid, 404, "NOT_FOUND", "Workout was not found.");
  return apiSuccess(rid, { ...session.data, sets: sets.data ?? [] });
}
