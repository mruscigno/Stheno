import type { Session } from "@supabase/supabase-js";
import type { MemberReadModel, NutritionReadModel, ProgramReadModel, ProgressReadModel, TodayReadModel } from "@shared/contracts/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { createMobileApiClient } from "../lib/api";
import { track } from "../lib/analytics";
import { clearUserScopedCache } from "../lib/secure-store";
import { getSupabaseClient, installAuthRefreshLifecycle } from "../lib/supabase";

type AuthState = { status: "loading" | "signedOut" | "signedIn" | "error"; session: Session | null; member: MemberReadModel | null; today: TodayReadModel | null; program: ProgramReadModel; nutrition: NutritionReadModel | null; progress: ProgressReadModel | null; error: unknown; refresh: () => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<MemberReadModel | null>(null);
  const [today, setToday] = useState<TodayReadModel | null>(null);
  const [program, setProgram] = useState<ProgramReadModel>(null);
  const [nutrition, setNutrition] = useState<NutritionReadModel | null>(null);
  const [progress, setProgress] = useState<ProgressReadModel | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [error, setError] = useState<unknown>(null);

  const bootstrap = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession); setError(null);
    if (!nextSession) { setMember(null); setToday(null); setProgram(null); setNutrition(null); setProgress(null); setStatus("signedOut"); return; }
    setStatus("loading");
    try {
      const api = createMobileApiClient();
      const [memberResponse, todayResponse, programResponse, nutritionResponse, progressResponse] = await Promise.all([api.me(), api.today(), api.program(), api.nutrition(), api.progress()]);
      if (memberResponse.apiVersion !== "1.0" || todayResponse.apiVersion !== "1.0") throw new Error("API_VERSION_MISMATCH");
      setMember(memberResponse.data); setToday(todayResponse.data); setProgram(programResponse.data); setNutrition(nutritionResponse.data); setProgress(progressResponse.data); setStatus("signedIn");
    } catch (nextError) {
      setError(nextError); setStatus("error");
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const removeLifecycle = installAuthRefreshLifecycle(supabase);
    void supabase.auth.getSession().then(({ data }) => bootstrap(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") { void clearUserScopedCache(); }
      if (event === "TOKEN_REFRESHED" && !nextSession) track("session_expired");
      void bootstrap(nextSession);
    });
    return () => { listener.subscription.unsubscribe(); removeLifecycle(); };
  }, [bootstrap]);

  const value = useMemo<AuthState>(() => ({ status, session, member, today, program, nutrition, progress, error, refresh: () => bootstrap(session), signOut: async () => { await getSupabaseClient().auth.signOut({ scope: "local" }); await clearUserScopedCache(); track("signout"); } }), [bootstrap, error, member, nutrition, program, progress, session, status, today]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be inside AuthProvider"); return value; }
