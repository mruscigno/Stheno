import { POST as legacyCoachQuestion } from "@/app/api/coach/route";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const id = requestId(request);
  const authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(id, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const response = await legacyCoachQuestion(request);
  const body = await response.json().catch(() => null);
  if (response.ok) return apiSuccess(id, body, { status: response.status });
  if (response.status === 401) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (response.status === 400) return apiError(id, 400, "VALIDATION_FAILED", body?.error ?? "Invalid Coach question.");
  if (response.status === 404) return apiError(id, 404, "NOT_FOUND", body?.error ?? "Conversation not found.");
  return apiError(id, response.status, "SERVICE_UNAVAILABLE", body?.error ?? "Coach is unavailable.");
}
