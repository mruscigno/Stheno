import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { captureFunnelServer } from "@/lib/analytics/funnel-server";
import { BLUEPRINT_MARKETING_CONSENT_VERSION, blueprintEmailRequestSchema, buildBlueprintEmail } from "@/modules/acquisition/blueprint-email";

const attempts = new Map<string, { count: number; reset: number }>();
function allowed(key: string) {
  const now = Date.now(), current = attempts.get(key);
  if (!current || current.reset < now) { attempts.set(key, { count: 1, reset: now + 60 * 60_000 }); return true; }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  const key = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (!allowed(key)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const parsed = blueprintEmailRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please enter a valid email address and try again." }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Email delivery is temporarily unavailable." }, { status: 503 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Email delivery is temporarily unavailable." }, { status: 503 });

  const data = parsed.data, email = data.email.trim().toLowerCase(), now = new Date().toISOString();
  const { data: existing } = await admin.from("blueprint_email_leads").select("id,marketing_consent,marketing_consented_at,consent_language_version,consent_source,delivery_count").eq("email_normalized", email).maybeSingle();
  const lead = {
    email,
    marketing_consent: Boolean(existing?.marketing_consent || data.marketingConsent),
    marketing_consented_at: existing?.marketing_consented_at ?? (data.marketingConsent ? now : null),
    consent_language_version: data.marketingConsent ? BLUEPRINT_MARKETING_CONSENT_VERSION : existing?.consent_language_version ?? null,
    consent_source: data.marketingConsent ? "blueprint_email_form" : existing?.consent_source ?? null,
    anonymous_session_id: data.attribution?.sessionId ?? null,
    attribution_source: data.attribution?.source ?? null,
    attribution_medium: data.attribution?.medium ?? null,
    attribution_campaign: data.attribution?.campaign ?? null,
    last_requested_at: now,
    last_delivery_status: "pending",
    updated_at: now,
  };
  const write = existing?.id
    ? await admin.from("blueprint_email_leads").update(lead).eq("id", existing.id).select("id").single()
    : await admin.from("blueprint_email_leads").insert(lead).select("id").single();
  if (write.error) return NextResponse.json({ error: "We could not prepare your email. Please try again." }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.sthenofitness.com";
  const emailContent = buildBlueprintEmail(data, appUrl);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: process.env.BLUEPRINT_FROM_EMAIL ?? process.env.REMINDER_FROM_EMAIL ?? process.env.CONTACT_FROM_EMAIL ?? "STHENO Fitness <contact@sthenofitness.com>",
    to: email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });
  if (result.error) {
    await admin.from("blueprint_email_leads").update({ last_delivery_status: "failed", updated_at: new Date().toISOString() }).eq("id", write.data.id);
    await captureFunnelServer("blueprint_email_failed", data.attribution?.sessionId ?? null, { reason: "provider_error" });
    return NextResponse.json({ error: "Your Blueprint could not be delivered. Please try again shortly." }, { status: 502 });
  }
  await admin.from("blueprint_email_leads").update({ last_delivery_status: "sent", last_delivered_at: new Date().toISOString(), provider_message_id: result.data?.id ?? null, delivery_count: Number(existing?.delivery_count ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", write.data.id);
  await Promise.all([
    captureFunnelServer("blueprint_email_delivered", data.attribution?.sessionId ?? null, { marketing_consent: data.marketingConsent }),
    data.marketingConsent ? captureFunnelServer("blueprint_marketing_consent_granted", data.attribution?.sessionId ?? null, { consent_version: BLUEPRINT_MARKETING_CONSENT_VERSION }) : Promise.resolve(),
  ]);
  return NextResponse.json({ ok: true });
}
