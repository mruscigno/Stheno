import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { drainFormReviewJobs } from "@/modules/form-review/worker";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Backend service is not configured" }, { status: 503 });
  try {
    const result = await drainFormReviewJobs(supabase);
    return NextResponse.json({ ok: !result.failed, result }, { status: result.failed ? 207 : 200 });
  } catch {
    return NextResponse.json({ error: "Form-review worker failed safely." }, { status: 503 });
  }
}

