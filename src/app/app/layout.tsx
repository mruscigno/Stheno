import "@/components/brand/member-brand.css";
import "./member-shell.css";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/auth/actions";
import { ClaimPublicAssessment } from "@/components/assessment/claim-public-assessment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateMemberAccess } from "@/modules/access/trial";

const memberLinks = [
  ["/app", "Today"],
  ["/app/coach", "Coach"],
  ["/app/workout", "Workout"],
  ["/app/program", "Program"],
  ["/app/nutrition", "Nutrition"],
  ["/app/progress", "Progress"],
  ["/app/checkin", "Check-in"],
  ["/app/account", "Account"],
] as const;

const exploreLinks = [
  ["/insights", "Articles"],
  ["/exercises", "Exercises"],
  ["/tools", "Free tools"],
  ["/pricing", "Pricing"],
  ["/contact", "Contact"],
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  let access = null;

  if (user && db) {
    const { data: subscription } = await db
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    access = evaluateMemberAccess({
      accountCreatedAt: user.created_at,
      subscriptionStatus: subscription?.status,
    });
  }

  return (
    <div className="app-shell">
      <ClaimPublicAssessment />
      <aside className="app-nav">
        <Link className="member-brand" href="/app" aria-label="STHENO member home">
          <Image src="/stheno-logo.png" alt="" width={128} height={128} priority />
        </Link>
        <nav aria-label="Member navigation">
          <strong>Your STHENO</strong>
          {memberLinks.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <nav className="member-explore" aria-label="Explore STHENO">
          <strong>Explore</strong>
          {exploreLinks.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <form action={signOut}>
          <button className="member-signout" type="submit">Sign out</button>
        </form>
      </aside>
      <main className="app-content">
        {access?.state === "trial" ? (
          <aside className="trial-status" role="status">
            <span>Free trial</span>
            <strong>{access.daysRemaining} {access.daysRemaining === 1 ? "day" : "days"} remaining</strong>
            <Link href="/pricing">View plans</Link>
          </aside>
        ) : access?.state === "expired" ? (
          <aside className="trial-status expired" role="status">
            <strong>Trial ended</strong>
            <Link href="/pricing">Choose a plan</Link>
          </aside>
        ) : null}
        {children}
      </main>
    </div>
  );
}
