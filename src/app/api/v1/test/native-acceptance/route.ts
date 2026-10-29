import { authenticateRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";
import { armResponseLoss, nativeAcceptanceControlsEnabled } from "@/platform/server/native-acceptance-controls";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const id = requestId(request);
  if (!nativeAcceptanceControlsEnabled()) return apiError(id, 404, "NOT_FOUND", "Not found.");
  const context = await authenticateRequest(request);
  if (!context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  const body = await request.json().catch(() => null) as { action?: string } | null;
  if (body?.action !== "lose-next-workout-response") return apiError(id, 400, "VALIDATION_FAILED", "Unknown acceptance action.");
  armResponseLoss(context.user.id);
  return apiSuccess(id, { armed: true, userId: context.user.id });
}
