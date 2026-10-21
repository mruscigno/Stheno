import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/platform/server/auth";
import { FORM_REVIEW_BUCKET } from "@/modules/form-review/contracts";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await authenticateRequest(request); if (!context) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  const { id } = await params; const { data } = await context.db.from("coach_form_reviews").select("id,conversation_id,exercise_slug,camera_view,processing_status,rubric_version,structured_result,failure_reason,created_at,completed_at,retention_delete_at").eq("id", id).eq("user_id", context.user.id).maybeSingle();
  return data ? NextResponse.json({ review: data }) : NextResponse.json({ error: "Review not found." }, { status: 404 });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await authenticateRequest(request); if (!context) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  const { id } = await params; const { data } = await context.db.from("coach_form_reviews").select("id,object_path,processing_status").eq("id", id).eq("user_id", context.user.id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const admin = createSupabaseAdminClient(); if (!admin) return NextResponse.json({ error: "Private storage is unavailable." }, { status: 503 });
  const { error: storageError } = await admin.storage.from(FORM_REVIEW_BUCKET).remove([data.object_path]);
  if (storageError) return NextResponse.json({ error: "The private video could not be deleted. Nothing was marked deleted; try again." }, { status: 503 });
  const now = new Date().toISOString();
  const { data: deleted, error: updateError } = await context.db.from("coach_form_reviews").update({ processing_status: "deleted", upload_status: "deleted", structured_result: null, member_question: null, consent_revoked_at: now, cleanup_failure_reason: null, cleanup_lease_token: null, cleanup_lease_expires_at: null, deleted_at: now, updated_at: now }).eq("id", id).eq("user_id", context.user.id).select("id").maybeSingle();
  if (updateError || !deleted) return NextResponse.json({ error: "The video was deleted, but the review record could not be finalized. Support has been notified." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
