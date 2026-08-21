import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function hasEditorialAccess(user: User | null) {
  if (!user) return false;
  const role=String(user.app_metadata?.role??"");
  if (role==="admin"||role==="editor") return true;
  const admin=createSupabaseAdminClient();if(!admin)return false;
  const{data}=await admin.from("editorial_admins").select("user_id").eq("user_id",user.id).maybeSingle();
  return Boolean(data);
}
