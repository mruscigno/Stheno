import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Notice, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { track } from "@/lib/analytics";
import { parseAuthCallback } from "@/lib/deep-links";
import { getSupabaseClient } from "@/lib/supabase";
import { loadCapability } from "@/lib/anonymous-assessment";

export default function AuthCallbackScreen() { const router = useRouter(); const [state, setState] = useState<"working" | "invalid" | "complete">("working"); useEffect(() => { void (async () => { const raw = await Linking.getInitialURL(); const callback = raw ? parseAuthCallback(raw) : { kind: "invalid" as const }; if (callback.kind === "invalid") { setState("invalid"); return; } const supabase = getSupabaseClient(); const result = callback.kind === "code" ? await supabase.auth.exchangeCodeForSession(callback.code) : await supabase.auth.verifyOtp({ token_hash: callback.tokenHash, type: callback.type }); if (result.error) { setState("invalid"); return; } track("auth_verified"); setState("complete"); if (callback.kind === "otp" && callback.type === "recovery") router.replace("/auth/reset"); else router.replace((await loadCapability())?"/blueprint":"/"); })(); }, [router]); return <Screen><SthenoLogo /><Eyebrow>Secure link</Eyebrow><Title>{state === "working" ? "Verifying…" : state === "complete" ? "Verified." : "This link is no longer valid."}</Title>{state === "invalid" ? <><Notice tone="error">The link may be expired, malformed, or intended for another environment.</Notice><Button onPress={() => router.replace("/sign-in")}>Return to sign in</Button></> : <Body muted>Keep this screen open while STHENO checks the link.</Body>}</Screen>; }
