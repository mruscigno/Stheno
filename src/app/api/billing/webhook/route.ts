import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { analytics } from "@heycatch/sdk";
import { stripe } from "@/lib/stripe";
import { captureServerEvent } from "@/lib/analytics/server";

analytics.init({ projectKey: "hck_pk_dHLKWbUi7UUrnBvLWuJJn60N1J7eHAiq" });

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature"), secret = process.env.STRIPE_WEBHOOK_SECRET,
    url = process.env.NEXT_PUBLIC_SUPABASE_URL, service = process.env.SUPABASE_SECRET_KEY;
  if (!signature || !secret || !url || !service) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let event: Stripe.Event;
  try { event = stripe().webhooks.constructEvent(await request.text(), signature, secret); }
  catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }

  const db = createClient(url, service, { auth: { persistSession: false } });
  const receipt = await db.from("stripe_webhook_receipts").insert({ provider_event_id: event.id, event_type: event.type, payload_sha256: event.id, status: "processing" }).select("id").maybeSingle();
  if (receipt.error?.code === "23505") return NextResponse.json({ received: true, duplicate: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session, userId = session.metadata?.user_id;
      if (userId) await captureServerEvent("checkout_completed", userId, { plan: session.metadata?.plan ?? "unknown", payment_status: session.payment_status });
    }

    if (event.type.startsWith("customer.subscription.")) {
      const sub = event.data.object as Stripe.Subscription, userId = sub.metadata.user_id;
      if (userId) {
        const interval = sub.items.data[0]?.price.recurring?.interval ?? "month", plan = interval === "year" ? "annual" : "monthly",
          activeStatuses = ["active", "trialing"], previousStatus = (event.data.previous_attributes as Partial<Stripe.Subscription> | undefined)?.status,
          becameActive = activeStatuses.includes(sub.status) && event.type === "customer.subscription.created",
          reactivated = event.type === "customer.subscription.updated" && activeStatuses.includes(sub.status) && Boolean(previousStatus) && !activeStatuses.includes(previousStatus!),
          converted = event.type === "customer.subscription.updated" && previousStatus === "trialing" && sub.status === "active",
          cancelled = event.type === "customer.subscription.deleted" || (event.type === "customer.subscription.updated" && sub.status === "canceled" && previousStatus !== "canceled"),
          pastDue = event.type === "customer.subscription.updated" && sub.status === "past_due" && previousStatus !== "past_due";
        await db.from("subscriptions").upsert({ user_id: userId, stripe_customer_id: String(sub.customer), stripe_subscription_id: sub.id, status: sub.status, billing_interval: interval, current_period_end: new Date(sub.items.data[0]?.current_period_end * 1000).toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        await db.from("entitlements").upsert({ user_id: userId, feature_key: "premium", is_enabled: activeStatuses.includes(sub.status), source: "stripe", updated_at: new Date().toISOString() }, { onConflict: "user_id,feature_key" });
        await analytics.setIdentity(userId, { plan });
        if (becameActive) await Promise.all([analytics.trackEvent("subscription_started", { plan, status: sub.status }, { userId }), captureServerEvent("subscription_started", userId, { plan, status: sub.status })]);
        if (reactivated) await captureServerEvent("subscription_reactivated", userId, { plan, status: sub.status });
        if (converted) await captureServerEvent("trial_converted_to_paid", userId, { plan });
        if (cancelled) await Promise.all([analytics.trackEvent("subscription_cancelled", { plan, status: sub.status }, { userId }), captureServerEvent("subscription_cancelled", userId, { plan, status: sub.status })]);
        if (pastDue) await captureServerEvent("subscription_past_due", userId, { plan });
      }
    }

    if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice, customerId = String(invoice.customer),
        { data: subscription } = await db.from("subscriptions").select("user_id,billing_interval").eq("stripe_customer_id", customerId).maybeSingle();
      if (subscription?.user_id) {
        const plan = subscription.billing_interval === "year" ? "annual" : "monthly";
        if (event.type === "invoice.payment_failed") await captureServerEvent("payment_failed", subscription.user_id, { plan });
        else if (invoice.billing_reason === "subscription_cycle") await captureServerEvent("subscription_renewed", subscription.user_id, { plan });
      }
    }

    await db.from("stripe_webhook_receipts").update({ status: "processed", processed_at: new Date().toISOString() }).eq("provider_event_id", event.id);
  } catch (error) {
    await db.from("stripe_webhook_receipts").update({ status: "failed", error_message: error instanceof Error ? error.message : "Unknown" }).eq("provider_event_id", event.id);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
