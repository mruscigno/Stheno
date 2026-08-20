import Link from "next/link";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {AccountActions} from "@/components/account/account-actions";
import{evaluateMemberAccess}from"@/modules/access/trial";
export default async function Account(){
  const db=await createSupabaseServerClient();const{data:{user}}=db?await db.auth.getUser():{data:{user:null}};if(!user)redirect("/login");
  const[{data:sub},{data:profile},{data:preferences}]=await Promise.all([db!.from("subscriptions").select("status,billing_interval,current_period_end,stripe_customer_id").eq("user_id",user.id).maybeSingle(),db!.from("profiles").select("lifecycle_state,created_at").eq("user_id",user.id).maybeSingle(),db!.from("user_preferences").select("unit_system").eq("user_id",user.id).maybeSingle()]);
  const access=evaluateMemberAccess({accountCreatedAt:user.created_at,subscriptionStatus:sub?.status}),paid=access.state==="paid",status=access.state==="trial"?"Free trial":paid?"Active membership":"Trial ended";
  return <section className="account-page"><header><p className="eyebrow">Account</p><h1>Manage your STHENO.</h1><p>Manage your profile, membership, preferences, and privacy.</p></header><div className="account-card-grid">
    <section className="account-card"><p className="kicker">Profile</p><h2>{user.email}</h2><p>Member since {new Date(profile?.created_at??user.created_at).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})}</p><Link className="button secondary" href="/app/profile">Edit profile</Link></section>
    <section className="account-card membership-card"><p className="kicker">Membership</p><h2>{status}</h2><p>{access.state==="trial"?`${access.daysRemaining} ${access.daysRemaining===1?"day":"days"} remaining · ends ${new Date(access.trialEndsAt).toLocaleDateString()}`:sub?.current_period_end?`Current period ends ${new Date(sub.current_period_end).toLocaleDateString()}`:"Your saved progress remains available."}</p>{sub?.stripe_customer_id?<form action="/api/billing/portal" method="post"><button className="button" type="submit">Manage or cancel subscription</button></form>:<Link className="button" href="/pricing">Choose a plan</Link>}<small>Subscription changes are completed securely in Stripe.</small></section>
    <section className="account-card"><p className="kicker">Security</p><h2>Password &amp; sessions</h2><p>Reset your password securely by email. Sign out from the member navigation when you finish.</p><Link className="button secondary" href="/forgot-password">Change password</Link></section>
    <section className="account-card"><p className="kicker">Preferences</p><h2>{preferences?.unit_system==="metric"?"Metric":"US customary"} units</h2><p>Update your units, fitness details, and communication preferences.</p><Link className="button secondary" href="/app/profile">Manage preferences</Link></section>
  </div><AccountActions/></section>;
}
