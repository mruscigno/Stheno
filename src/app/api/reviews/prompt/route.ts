import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const Body = z.object({
  providerName: z.string().min(1).max(100),
  milestone: z.string().min(1).max(100),
  action: z.enum(["shown", "clicked", "dismissed"]),
});
export async function POST(request: Request) {
  const db = await createSupabaseServerClient();
  if (!db) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { error } = await db
    .from("review_prompt_events")
    .insert({
      user_id: user.id,
      provider_name: parsed.data.providerName,
      milestone: parsed.data.milestone,
      action: parsed.data.action,
    });
  return error
    ? NextResponse.json({ error: "Could not record event" }, { status: 500 })
    : NextResponse.json({ recorded: true });
}
