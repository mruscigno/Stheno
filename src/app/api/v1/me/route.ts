import { authenticateRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { memberReadModel } from "@/platform/server/read-models";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = requestId(request);
  const context = await authenticateRequest(request);
  if (!context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  try { return apiSuccess(id, await memberReadModel(context.db, context.user)); }
  catch { return apiError(id, 503, "SERVICE_UNAVAILABLE", "Member profile is unavailable."); }
}

const Preferences = z.object({ unitSystem: z.enum(["imperial", "metric"]).optional(), locale: z.string().min(2).max(20).optional(), timeZone: z.string().min(1).max(80).optional() }).refine((value) => Object.keys(value).length > 0);
export async function PATCH(request: Request) {
  const id = requestId(request);
  const context = await authenticateRequest(request);
  if (!context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  const parsed = await parseJson(request, Preferences);
  if (!parsed.data) return apiError(id, 400, "VALIDATION_FAILED", "Invalid preference update.", parsed.error);
  const writes = [];
  if (parsed.data.unitSystem || parsed.data.locale) writes.push(context.db.from("user_preferences").update({ ...(parsed.data.unitSystem ? { unit_system: parsed.data.unitSystem } : {}), ...(parsed.data.locale ? { locale: parsed.data.locale } : {}) }).eq("user_id", context.user.id));
  if (parsed.data.timeZone) writes.push(context.db.from("profiles").update({ time_zone: parsed.data.timeZone }).eq("user_id", context.user.id));
  const results = await Promise.all(writes);
  if (results.some((result) => result.error)) return apiError(id, 503, "SERVICE_UNAVAILABLE", "Preferences could not be saved.");
  return apiSuccess(id, await memberReadModel(context.db, context.user));
}
