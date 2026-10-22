import { MonthlyReviewIntakeInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestIdValue = requestId(request), authorization = await authorizeMemberRequest(request), { id } = await params;
  if (!authorization.context) return apiError(requestIdValue, 401, "AUTH_REQUIRED", "Authentication is required.");
  const { data, error } = await authorization.context.db.from("monthly_reviews").select("*,monthly_recommendations(*)").eq("id", id).eq("user_id", authorization.context.user.id).maybeSingle();
  return error ? apiError(requestIdValue, 503, "SERVICE_UNAVAILABLE", "Monthly review is unavailable.") : data ? apiSuccess(requestIdValue, data) : apiError(requestIdValue, 404, "NOT_FOUND", "Monthly review was not found.");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestIdValue = requestId(request), authorization = await authorizeMemberRequest(request), { id } = await params;
  if (!authorization.context) return apiError(requestIdValue, 401, "AUTH_REQUIRED", "Authentication is required.");
  const parsed = await parseJson(request, MonthlyReviewIntakeInput);
  if (parsed.error) return apiError(requestIdValue, 400, "VALIDATION_FAILED", "Invalid review intake.", parsed.error);
  const { db, user } = authorization.context;
  const { data, error } = await db.from("monthly_reviews").update({ intake: parsed.data.intake, revision: parsed.data.baseRevision + 1, updated_at: new Date().toISOString(), status: "started" }).eq("id", id).eq("user_id", user.id).eq("revision", parsed.data.baseRevision).select("id,intake,revision,status,updated_at").maybeSingle();
  if (error) return apiError(requestIdValue, 503, "SERVICE_UNAVAILABLE", "Review progress could not be saved.");
  return data ? apiSuccess(requestIdValue, data) : apiError(requestIdValue, 409, "CONFLICT", "Review progress changed on another device. Refresh before continuing.");
}
