import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";
import { monthlyReviews } from "@/platform/server/monthly-reviews";
import { z } from "zod";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const id = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(id, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const context = authorization.context;
  try { return apiSuccess(id, await monthlyReviews(context.db, context.user.id)); }
  catch { return apiError(id, 503, "SERVICE_UNAVAILABLE", "Monthly reviews are unavailable."); }
}

export async function POST(request: Request) {
  const id = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(id, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const parsed = z.object({ action: z.literal("start") }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(id, 400, "VALIDATION_FAILED", "Invalid monthly review command.");
  const { db, user } = authorization.context;
  const { data: state } = await db.from("member_review_state").select("*").eq("user_id", user.id).maybeSingle();
  if (!state?.monthly_review_due) return apiError(id, 409, "CONFLICT", "No monthly review is due.");
  let { data: review } = await db.from("monthly_reviews").select("*").eq("user_id", user.id).in("status", ["due", "started"]).order("due_at", { ascending: false }).limit(1).maybeSingle();
  if (!review) {
    const due = new Date(state.next_monthly_review_at), start = new Date(due.getTime() - 28 * 86_400_000);
    const created = await db.from("monthly_reviews").insert({ user_id: user.id, period_start: start.toISOString().slice(0, 10), period_end: due.toISOString().slice(0, 10), due_at: state.next_monthly_review_at, status: "started", started_at: new Date().toISOString() }).select("*").single();
    review = created.data;
  } else if (review.status === "due") {
    const updated = await db.from("monthly_reviews").update({ status: "started", started_at: review.started_at ?? new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", review.id).eq("user_id", user.id).select("*").single();
    review = updated.data;
  }
  await db.from("member_review_state").update({ monthly_review_status: "started", updated_at: new Date().toISOString() }).eq("user_id", user.id);
  return apiSuccess(id, review);
}
