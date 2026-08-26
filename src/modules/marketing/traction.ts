import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const getCompletedAssessmentCount = unstable_cache(
  async () => {
    const db = createSupabaseAdminClient();
    if (!db) return null;
    const { count, error } = await db
      .from("assessments")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed");
    return error ? null : count;
  },
  ["completed-assessment-count"],
  { revalidate: 3600 },
);

export async function getPublicTraction() {
  const count = await getCompletedAssessmentCount();
  const threshold = Number(process.env.TRACTION_DISPLAY_THRESHOLD ?? 25);
  if (count === null || !Number.isFinite(threshold) || count < threshold)
    return null;
  return { count };
}
