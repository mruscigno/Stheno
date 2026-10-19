import { ExerciseListQuery } from "@/platform/contracts/api";
import { createPublicDataClient } from "@/platform/server/auth";
import { listExercises } from "@/platform/server/exercises";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = requestId(request);
  const url = new URL(request.url);
  const parsed = ExerciseListQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return apiError(id, 400, "VALIDATION_FAILED", "Invalid exercise filters.", parsed.error.issues);
  const db = createPublicDataClient();
  if (!db) return apiError(id, 503, "SERVICE_UNAVAILABLE", "Exercise catalog is unavailable.");
  try {
    const result = await listExercises(db, parsed.data);
    return apiSuccess(id, result.items, undefined, { nextCursor: result.nextCursor, limit: parsed.data.limit });
  } catch {
    return apiError(id, 503, "SERVICE_UNAVAILABLE", "Exercise catalog is unavailable.");
  }
}
