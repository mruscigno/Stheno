"use client";

import { useEffect } from "react";
import { analytics } from "@heycatch/sdk";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { identifyAnalyticsUser, resetAnalyticsIdentity } from "@/lib/analytics/client";
import { HEYCATCH_IDENTITY_STORAGE } from "@/lib/analytics/funnel-client";

function identify(user: User) {
  const metadata = user.user_metadata as Record<string, unknown>;
  const candidateName = metadata.name ?? metadata.full_name ?? metadata.display_name;
  analytics.setIdentity(
    user.id,
    {
      ...(user.email ? { email: user.email } : {}),
      ...(typeof candidateName === "string" && candidateName.trim() ? { name: candidateName.trim() } : {}),
    },
    { signup_date: user.created_at },
  );
  try { localStorage.setItem(HEYCATCH_IDENTITY_STORAGE, user.id); } catch { /* Analytics persistence must not block auth. */ }
  identifyAnalyticsUser(user.id, { ...(user.email ? { email: user.email } : {}) });
}

export function HeyCatchIdentity() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { try { localStorage.removeItem(HEYCATCH_IDENTITY_STORAGE); } catch { /* continue */ } analytics.resetIdentity(); resetAnalyticsIdentity(); return; }
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) identify(data.user); else { try { localStorage.removeItem(HEYCATCH_IDENTITY_STORAGE); } catch { /* continue */ } analytics.resetIdentity(); resetAnalyticsIdentity(); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) identify(session.user); else { try { localStorage.removeItem(HEYCATCH_IDENTITY_STORAGE); } catch { /* continue */ } analytics.resetIdentity(); resetAnalyticsIdentity(); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  return null;
}
