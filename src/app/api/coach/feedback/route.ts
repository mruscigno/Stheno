import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/analytics/server";

const Input = z.object({ messageId: z.uuid(), helpful: z.boolean(), reasonCode: z.enum(["incorrect", "unclear", "too_long", "not_personalized", "unsafe", "other"]).optional() });

export async function POST(request: Request) {
  const db = await createSupabaseServerClient();
  if (!db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  const { data: message } = await db.from("coach_messages").select("id,domain").eq("id", parsed.data.messageId).eq("user_id", user.id).maybeSingle();
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  await db.from("coach_answer_feedback").upsert({ user_id: user.id, message_id: message.id, helpful: parsed.data.helpful, reason_code: parsed.data.reasonCode }, { onConflict: "user_id,message_id" });
  if (!parsed.data.helpful && message.domain === "out_of_domain") await captureServerEvent("coach_false_refusal_feedback", user.id, { reason_code: parsed.data.reasonCode ?? "unspecified" });
  return NextResponse.json({ saved: true });
}
