import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";

const Views = ["front", "left", "back", "right"] as const;
const Command = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), monthlyReviewId: z.uuid().optional(), consentVersion: z.literal("progress-photos-v1") }),
  z.object({ action: z.literal("complete"), setId: z.uuid() }),
]);
const Remove = z.discriminatedUnion("action", [z.object({ action: z.literal("delete_set"), setId: z.uuid() }), z.object({ action: z.literal("delete_all") })]);

async function context(request: Request) {
  const authorization = await authorizeMemberRequest(request);
  return { authorization, admin: createSupabaseAdminClient() };
}

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const id = requestId(request), { authorization, admin } = await context(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (!admin) return apiError(id, 503, "SERVICE_UNAVAILABLE", "Photo storage is unavailable.");
  const { db, user } = authorization.context;
  const { data, error } = await db.from("progress_photo_sets").select("*,progress_photo_views(id,view,storage_path)").eq("user_id", user.id).order("captured_at", { ascending: false });
  if (error) return apiError(id, 503, "SERVICE_UNAVAILABLE", "Progress photos are unavailable.");
  const sets = await Promise.all((data ?? []).map(async (set) => ({ ...set, progress_photo_views: await Promise.all((set.progress_photo_views ?? []).map(async (photo: { id: string; view: string; storage_path: string }) => {
    const { data: signed } = await admin.storage.from("progress-photos").createSignedUrl(photo.storage_path, 900);
    return { id: photo.id, view: photo.view, url: signed?.signedUrl ?? null };
  })) })));
  return apiSuccess(id, { sets, signedUrlTtlSeconds: 900 });
}

export async function POST(request: Request) {
  const id = requestId(request), { authorization } = await context(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  const { db, user } = authorization.context;
  const parsed = Command.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(id, 400, "VALIDATION_FAILED", "Invalid photo command.", parsed.error.flatten());
  if (parsed.data.action === "create") {
    const { count } = await db.from("progress_photo_sets").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    const { data, error } = await db.from("progress_photo_sets").insert({ user_id: user.id, monthly_review_id: parsed.data.monthlyReviewId, baseline: (count ?? 0) === 0, consent_version: parsed.data.consentVersion, consent_scope: "progress_review_only", consented_at: new Date().toISOString(), status: "draft" }).select("id,baseline,status").single();
    return error ? apiError(id, 503, "SERVICE_UNAVAILABLE", "Photo set could not be created.") : apiSuccess(id, data, undefined, { consentScope: "progress_review_only" });
  }
  const { data: photos } = await db.from("progress_photo_views").select("view").eq("photo_set_id", parsed.data.setId).eq("user_id", user.id);
  if (!photos?.length) return apiError(id, 400, "VALIDATION_FAILED", "Add at least one photo or skip this optional step.");
  const views = photos.map((photo) => photo.view);
  const { error } = await db.from("progress_photo_sets").update({ views, completed_at: new Date().toISOString(), status: "complete" }).eq("id", parsed.data.setId).eq("user_id", user.id);
  return error ? apiError(id, 503, "SERVICE_UNAVAILABLE", "Photo set could not be completed.") : apiSuccess(id, { setId: parsed.data.setId, views });
}

export async function PUT(request: Request) {
  const id = requestId(request), { authorization, admin } = await context(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (!admin) return apiError(id, 503, "SERVICE_UNAVAILABLE", "Photo storage is unavailable.");
  const { db, user } = authorization.context;
  const form = await request.formData(), setId = String(form.get("setId") ?? ""), view = String(form.get("view") ?? ""), file = form.get("file");
  if (!z.uuid().safeParse(setId).success || !Views.includes(view as typeof Views[number]) || !(file instanceof File) || file.size > 10_485_760 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return apiError(id, 400, "VALIDATION_FAILED", "Use a JPEG, PNG, or WebP photo no larger than 10 MB.");
  const { data: set } = await db.from("progress_photo_sets").select("id,status").eq("id", setId).eq("user_id", user.id).maybeSingle();
  if (!set || set.status === "complete") return apiError(id, 409, "CONFLICT", "The photo set is unavailable or already complete.");
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg", path = `${user.id}/${setId}/${view}.${extension}`;
  const { error: uploadError } = await admin.storage.from("progress-photos").upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true, cacheControl: "private,max-age=3600" });
  if (uploadError) return apiError(id, 503, "SERVICE_UNAVAILABLE", "Photo upload failed.");
  const { error } = await db.from("progress_photo_views").upsert({ user_id: user.id, photo_set_id: setId, view, storage_path: path }, { onConflict: "photo_set_id,view" });
  return error ? apiError(id, 503, "SERVICE_UNAVAILABLE", "Photo metadata could not be saved.") : apiSuccess(id, { setId, view });
}

export async function DELETE(request: Request) {
  const id = requestId(request), { authorization, admin } = await context(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (!admin) return apiError(id, 503, "SERVICE_UNAVAILABLE", "Photo storage is unavailable.");
  const { db, user } = authorization.context;
  const parsed = Remove.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(id, 400, "VALIDATION_FAILED", "Invalid deletion request.");
  let query = db.from("progress_photo_views").select("storage_path").eq("user_id", user.id);
  if (parsed.data.action === "delete_set") query = query.eq("photo_set_id", parsed.data.setId);
  const { data: photos } = await query;
  if (photos?.length) await admin.storage.from("progress-photos").remove(photos.map((photo) => photo.storage_path));
  let removal = db.from("progress_photo_sets").delete().eq("user_id", user.id);
  if (parsed.data.action === "delete_set") removal = removal.eq("id", parsed.data.setId);
  const { error } = await removal;
  return error ? apiError(id, 503, "SERVICE_UNAVAILABLE", "Photos could not be deleted.") : apiSuccess(id, { deletedFiles: photos?.length ?? 0 });
}
