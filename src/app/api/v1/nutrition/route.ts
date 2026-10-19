import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";
import { nutritionReadModel } from "@/platform/server/read-models";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const id = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(id, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const context = authorization.context;
  try { return apiSuccess(id, await nutritionReadModel(context.db, context.user.id)); }
  catch { return apiError(id, 503, "SERVICE_UNAVAILABLE", "Nutrition is unavailable."); }
}
