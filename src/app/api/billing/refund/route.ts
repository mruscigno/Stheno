import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { captureServerEvent } from "@/lib/analytics/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { evaluateGuarantee } from "@/modules/commerce/guarantee";

const RequestBody = z.object({
  reason: z.string().trim().max(1000).optional(),
});

async function refundContext() {
  const db = await createSupabaseServerClient();
  if (!db) return null;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: subscription } = await db
    .from("subscriptions")
    .select("stripe_customer_id,stripe_subscription_id,status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!subscription?.stripe_customer_id)
    return {
      db,
      user,
      subscription: null,
      charge: null,
      eligible: false,
      reason: "No paid charge was found for this account.",
    };
  const charges = await stripe().charges.list({
    customer: subscription.stripe_customer_id,
    limit: 100,
  });
  const charge =
    charges.data
      .filter((item) => item.paid && item.amount > 0)
      .sort((a, b) => a.created - b.created)[0] ?? null;
  if (!charge)
    return {
      db,
      user,
      subscription,
      charge: null,
      eligible: false,
      reason: "No paid charge was found for this account.",
    };
  const guarantee = evaluateGuarantee(new Date(charge.created * 1000));
  const alreadyRefunded =
    charge.refunded || charge.amount_refunded >= charge.amount;
  return {
    db,
    user,
    subscription,
    charge,
    eligible: !alreadyRefunded && guarantee.eligible,
    reason: alreadyRefunded
      ? "The first paid charge has already been refunded."
      : !guarantee.eligible
        ? "The 30-day refund window for the first paid charge has ended."
        : null,
    deadline: guarantee.deadline.toISOString(),
  };
}

export async function GET() {
  const context = await refundContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    eligible: context.eligible,
    reason: context.reason,
    deadline: context.deadline ?? null,
    firstPaidAt: context.charge
      ? new Date(context.charge.created * 1000).toISOString()
      : null,
  });
}

export async function POST(request: Request) {
  const context = await refundContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = RequestBody.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please shorten the request and try again." },
      { status: 400 },
    );
  if (!context.eligible || !context.charge || !context.subscription)
    return NextResponse.json(
      {
        error:
          context.reason ?? "This charge is not eligible for the guarantee.",
      },
      { status: 409 },
    );
  const firstPaidAt = new Date(context.charge.created * 1000).toISOString();
  const inserted = await context.db
    .from("refund_requests")
    .insert({
      user_id: context.user.id,
      stripe_charge_id: context.charge.id,
      first_paid_at: firstPaidAt,
      reason: parsed.data.reason || null,
      eligibility: "eligible",
      status: "processing",
    })
    .select("id")
    .single();
  if (inserted.error?.code === "23505")
    return NextResponse.json(
      { error: "A refund request for this charge has already been submitted." },
      { status: 409 },
    );
  if (inserted.error)
    return NextResponse.json(
      { error: "The request could not be recorded. No refund was issued." },
      { status: 500 },
    );
  try {
    const stripeClient = stripe();
    const refund = await stripeClient.refunds.create(
      {
        charge: context.charge.id,
        reason: "requested_by_customer",
        metadata: {
          user_id: context.user.id,
          refund_request_id: inserted.data.id,
          guarantee: "first_paid_charge_30_days",
        },
      },
      { idempotencyKey: `stheno-guarantee-${context.charge.id}` },
    );
    let cancellationFailed = false;
    if (context.subscription.stripe_subscription_id) {
      try {
        await stripeClient.subscriptions.cancel(
          context.subscription.stripe_subscription_id,
        );
      } catch {
        cancellationFailed = true;
      }
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      secret = process.env.SUPABASE_SECRET_KEY;
    if (url && secret) {
      const admin = createClient(url, secret, {
          auth: { persistSession: false },
        }),
        now = new Date().toISOString();
      await Promise.all([
        admin
          .from("refund_requests")
          .update({
            stripe_refund_id: refund.id,
            status: "refunded",
            processed_at: now,
          })
          .eq("id", inserted.data.id),
        ...(cancellationFailed
          ? []
          : [
              admin
                .from("subscriptions")
                .update({ status: "canceled", updated_at: now })
                .eq("user_id", context.user.id),
            ]),
        admin
          .from("entitlements")
          .update({ is_enabled: false, updated_at: now })
          .eq("user_id", context.user.id)
          .eq("feature_key", "premium"),
      ]);
    }
    await captureServerEvent("money_back_refund_completed", context.user.id, {
      guarantee: "first_paid_charge_30_days",
    });
    return NextResponse.json(
      {
        refunded: true,
        cancellationFailed,
        refundId: refund.id,
        message: cancellationFailed
          ? "Your first paid charge was refunded. We could not automatically cancel the subscription, so support has been alerted; you can also cancel it now from Manage billing."
          : "Your first paid charge was refunded and the subscription was cancelled. Stripe will return the funds to the original payment method.",
      },
      { status: cancellationFailed ? 202 : 200 },
    );
  } catch (error) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      secret = process.env.SUPABASE_SECRET_KEY;
    if (url && secret)
      await createClient(url, secret, { auth: { persistSession: false } })
        .from("refund_requests")
        .update({
          status: "failed",
          processed_at: new Date().toISOString(),
          failure_code: error instanceof Error ? error.name : "unknown",
        })
        .eq("id", inserted.data.id);
    return NextResponse.json(
      {
        error:
          "Stripe could not complete the refund. No subscription change was made; contact support and reference this request.",
      },
      { status: 502 },
    );
  }
}
