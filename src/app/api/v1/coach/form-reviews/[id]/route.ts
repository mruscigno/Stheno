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
  await admin.storage.from(FORM_REVIEW_BUCKET).remove([data.object_path]);
  await context.db.from("coach_form_reviews").update({ processing_status: "deleted", upload_status: "deleted", structured_result: null, member_question: null, deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", context.user.id);
  return NextResponse.json({ ok: true });
}
