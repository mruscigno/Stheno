import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { FORM_REVIEW_BUCKET, submitReviewSchema } from "@/modules/form-review/contracts";
import { isFormReviewProcessingEnabled, isFormReviewUserEnabled, providerUnavailableResult, validateReviewEligibility } from "@/modules/form-review/service";

export async function POST(request: Request) {
  const authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  if (authorization.state === "expired") return NextResponse.json({ error: "Membership access is required." }, { status: 402 });
  if (!isFormReviewUserEnabled(authorization.context.user.id)) return NextResponse.json({ error: "Form review is not yet enabled for this account." }, { status: 503 });
  const parsed = submitReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review submission." }, { status: 400 });
  const { db, user } = authorization.context;
  const { data: review } = await db.from("coach_form_reviews").select("*").eq("id", parsed.data.reviewId).eq("user_id", user.id).maybeSingle();
  if (!review || review.processing_status === "deleted") return NextResponse.json({ error: "Review not found." }, { status: 404 });
  if (new Date(review.upload_expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Upload authorization expired." }, { status: 410 });
  const eligibility = validateReviewEligibility({ exerciseSlug: review.exercise_slug, byteSize: Number(review.byte_size), mediaType: review.media_type, durationSeconds: parsed.data.durationSeconds, monthlyCount: 0 });
  if (!eligibility.ok) return NextResponse.json({ error: eligibility.message, code: eligibility.code }, { status: 422 });
  const admin = createSupabaseAdminClient(); if (!admin) return NextResponse.json({ error: "Private storage is unavailable." }, { status: 503 });
  const { data: media, error: downloadError } = await admin.storage.from(FORM_REVIEW_BUCKET).download(review.object_path);
  if (downloadError || !media) return NextResponse.json({ error: "The private upload is incomplete." }, { status: 409 });
  const bytes = new Uint8Array(await media.arrayBuffer()), signature = new TextDecoder().decode(bytes.slice(4, 8));
  if (bytes.byteLength !== Number(review.byte_size) || signature !== "ftyp") { await admin.storage.from(FORM_REVIEW_BUCKET).remove([review.object_path]); await db.from("coach_form_reviews").update({ upload_status: "rejected", processing_status: "failed", failure_reason: "MEDIA_VALIDATION_FAILED" }).eq("id", review.id).eq("user_id", user.id); return NextResponse.json({ error: "The uploaded file failed media validation." }, { status: 422 }); }
  if (!isFormReviewProcessingEnabled(user.id)) {
    const result = providerUnavailableResult(review.id, review.exercise_slug, review.camera_view);
    await db.from("coach_form_reviews").update({ upload_status: "validated", processing_status: "abstained", duration_seconds: parsed.data.durationSeconds, structured_result: result, failure_reason: "PROCESSOR_NOT_APPROVED", completed_at: new Date().toISOString() }).eq("id", review.id).eq("user_id", user.id);
    return NextResponse.json({ review: result, status: "abstained" }, { status: 202 });
  }
  await db.from("coach_form_reviews").update({ upload_status: "validated", processing_status: "queued", duration_seconds: parsed.data.durationSeconds }).eq("id", review.id).eq("user_id", user.id);
  return NextResponse.json({ reviewId: review.id, status: "queued" }, { status: 202 });
}
