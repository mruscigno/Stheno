import { createPublicDataClient } from "@/platform/server/auth";
import { exerciseDetail } from "@/platform/server/exercises";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestIdValue = requestId(request);
  const db = createPublicDataClient();
  if (!db) return apiError(requestIdValue, 503, "SERVICE_UNAVAILABLE", "Exercise catalog is unavailable.");
  const { id } = await params;
  if (!/^[a-z0-9-]{1,160}$/.test(id)) return apiError(requestIdValue, 400, "VALIDATION_FAILED", "Invalid exercise identifier.");
  try {
    const detail = await exerciseDetail(db, id);
    return detail ? apiSuccess(requestIdValue, detail) : apiError(requestIdValue, 404, "NOT_FOUND", "Exercise not found.");
  } catch {
    return apiError(requestIdValue, 503, "SERVICE_UNAVAILABLE", "Exercise catalog is unavailable.");
  }
}
