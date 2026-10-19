import { authenticateRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";
import { memberReadModel } from "@/platform/server/read-models";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = requestId(request);
  const context = await authenticateRequest(request);
  if (!context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  try { return apiSuccess(id, await memberReadModel(context.db, context.user)); }
  catch { return apiError(id, 503, "SERVICE_UNAVAILABLE", "Member profile is unavailable."); }
}
