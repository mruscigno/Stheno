import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { FORM_REVIEW_BUCKET, FORM_REVIEW_RETENTION_DAYS, uploadIntentSchema } from "@/modules/form-review/contracts";
import { formReviewFlags, safeObjectPath, validateReviewEligibility } from "@/modules/form-review/service";
import { formRubricFor } from "@/modules/methodology/form-rubrics";

export async function POST(request: Request) {
  if (!formReviewFlags.publicEnabled) return NextResponse.json({ error: "Form review is not yet publicly enabled." }, { status: 503 });
  const authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  if (authorization.state === "expired") return NextResponse.json({ error: "Membership access is required.", upgradeUrl: "/pricing" }, { status: 402 });
  const parsed = uploadIntentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request.", details: parsed.error.flatten() }, { status: 400 });
  const { db, user } = authorization.context;
  const exerciseLookup = db.from("exercises").select("id,slug");
  const exerciseQuery = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.data.exerciseId)
    ? exerciseLookup.eq("id", parsed.data.exerciseId)
    : exerciseLookup.eq("slug", parsed.data.exerciseId);
  const { data: exercise } = await exerciseQuery.maybeSingle();
  if (!exercise || !formRubricFor(exercise.slug)) return NextResponse.json({ error: "This exercise does not yet have a reviewed form rubric." }, { status: 422 });
  const since = new Date(); since.setUTCDate(1); since.setUTCHours(0, 0, 0, 0);
  const { count } = await db.from("coach_form_reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since.toISOString()).neq("processing_status", "deleted");
  const eligibility = validateReviewEligibility({ exerciseSlug: exercise.slug, byteSize: parsed.data.byteSize, mediaType: parsed.data.mediaType, monthlyCount: count ?? 0 });
  if (!eligibility.ok) return NextResponse.json({ error: eligibility.message, code: eligibility.code }, { status: 422 });
  const existing = await db.from("coach_form_reviews").select("id,object_path,processing_status,upload_expires_at").eq("user_id", user.id).eq("idempotency_key", parsed.data.idempotencyKey).maybeSingle();
  if (existing.data) {
    if (existing.data.processing_status !== "uploading" || new Date(existing.data.upload_expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ review: existing.data, duplicate: true }, { status: 409 });
    }
    const existingAdmin = createSupabaseAdminClient();
    if (!existingAdmin) return NextResponse.json({ error: "Private storage is unavailable." }, { status: 503 });
    const { data: signedUpload, error: signedUploadError } = await existingAdmin.storage
      .from(FORM_REVIEW_BUCKET)
      .createSignedUploadUrl(existing.data.object_path);
    if (signedUploadError || !signedUpload) return NextResponse.json({ error: "Unable to authorize the upload." }, { status: 503 });
    return NextResponse.json({
      reviewId: existing.data.id,
      path: signedUpload.path,
      token: signedUpload.token,
      signedUrl: signedUpload.signedUrl,
      expiresAt: existing.data.upload_expires_at,
      maxBytes: parsed.data.byteSize,
      maxDurationSeconds: 30,
      duplicate: true,
    });
  }
  const reviewId = crypto.randomUUID(), objectPath = safeObjectPath(user.id, reviewId, parsed.data.fileName), now = new Date(), uploadExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000), retentionDeleteAt = new Date(now.getTime() + FORM_REVIEW_RETENTION_DAYS * 86400000), rubric = formRubricFor(exercise.slug)!;
  const { error: insertError } = await db.from("coach_form_reviews").insert({ id: reviewId, user_id: user.id, conversation_id: parsed.data.conversationId, exercise_id: exercise.id, exercise_slug: exercise.slug, object_path: objectPath, consent_version: parsed.data.consentVersion, consented_at: now.toISOString(), camera_view: parsed.data.cameraView, member_question: parsed.data.question, byte_size: parsed.data.byteSize, media_type: parsed.data.mediaType, rubric_version: rubric.version, idempotency_key: parsed.data.idempotencyKey, upload_expires_at: uploadExpiresAt.toISOString(), retention_delete_at: retentionDeleteAt.toISOString() });
  if (insertError) return NextResponse.json({ error: "Unable to create a private review." }, { status: 500 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Private storage is unavailable." }, { status: 503 });
  const { data, error } = await admin.storage.from(FORM_REVIEW_BUCKET).createSignedUploadUrl(objectPath);
  if (error || !data) { await db.from("coach_form_reviews").update({ processing_status: "failed", failure_reason: "UPLOAD_INTENT_FAILED" }).eq("id", reviewId).eq("user_id", user.id); return NextResponse.json({ error: "Unable to authorize the upload." }, { status: 503 }); }
  return NextResponse.json({ reviewId, path: data.path, token: data.token, signedUrl: data.signedUrl, expiresAt: uploadExpiresAt.toISOString(), maxBytes: parsed.data.byteSize, maxDurationSeconds: 30 }, { status: 201 });
}
