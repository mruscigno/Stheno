import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluateMemberAccess } from "@/modules/access/trial";

const freeAppPaths=new Set(["/app/account","/app/assessment","/app/trial-ended"]);
const protectedApiPrefixes=["/api/calendar","/api/coach","/api/coaching","/api/plan","/api/training","/api/workouts"];
const isProtectedApi=(path:string)=>protectedApiPrefixes.some(prefix=>path===prefix||path.startsWith(`${prefix}/`));

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && request.nextUrl.pathname.startsWith("/app")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  if(user){
    const path=request.nextUrl.pathname,isPaidArea=(path.startsWith("/app")&&!freeAppPaths.has(path))||isProtectedApi(path);
    if(isPaidArea||path==="/app/trial-ended"){
      const{data:subscription}=await supabase.from("subscriptions").select("status").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle(),access=evaluateMemberAccess({accountCreatedAt:user.created_at,subscriptionStatus:subscription?.status});
      response.headers.set("x-stheno-access-state",access.state);
      response.headers.set("x-stheno-trial-days-remaining",String(access.daysRemaining));
      if(!access.hasAccess&&isProtectedApi(path))return NextResponse.json({error:"TRIAL_EXPIRED",message:"Your 14-day trial has ended. Choose a membership to continue.",upgradeUrl:"/pricing"},{status:402});
      if(!access.hasAccess&&path.startsWith("/app")&&path!=="/app/trial-ended")return NextResponse.redirect(new URL("/app/trial-ended",request.url));
      if(access.hasAccess&&path==="/app/trial-ended")return NextResponse.redirect(new URL("/app",request.url));
    }
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
