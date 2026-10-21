import { CoachExperience } from "@/components/coach/coach-experience";
import { FormReviewPanel } from "@/components/coach/form-review-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFormReviewUserEnabled } from "@/modules/form-review/service";

export default async function CoachPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const enabled = Boolean(user && isFormReviewUserEnabled(user.id));
  return <>{enabled ? <FormReviewPanel /> : null}<CoachExperience /></>;
}
