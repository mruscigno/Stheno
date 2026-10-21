import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { drainWorkoutOutbox } from "@/platform/server/workout-outbox";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Backend service is not configured" }, { status: 503 });
  try {
    return NextResponse.json({ ok: true, ...(await drainWorkoutOutbox(db)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OUTBOX_WORKER_FAILED" }, { status: 503 });
  }
}
