"use client";

import { useEffect } from "react";
import { analytics } from "@heycatch/sdk";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { identifyAnalyticsUser, resetAnalyticsIdentity } from "@/lib/analytics/client";

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
  identifyAnalyticsUser(user.id, { ...(user.email ? { email: user.email } : {}) });
}

export function HeyCatchIdentity() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { analytics.resetIdentity(); resetAnalyticsIdentity(); return; }
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) identify(data.user); else { analytics.resetIdentity(); resetAnalyticsIdentity(); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) identify(session.user); else { analytics.resetIdentity(); resetAnalyticsIdentity(); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  return null;
}
