import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SocialStudio } from "@/components/social-studio/social-studio";
import { findArticle } from "@/modules/library/articles";
import { hasEditorialAccess } from "@/lib/editorial/access";

export default async function SocialStudioPage({params}:{params:Promise<{slug:string}>}) {
  const db=await createSupabaseServerClient(),{data:{user}}=db?await db.auth.getUser():{data:{user:null}};if(!user)redirect(`/login?next=${encodeURIComponent(`/app/social-studio/${(await params).slug}`)}`);if(!await hasEditorialAccess(user))notFound();
  const article=findArticle((await params).slug);if(!article||article.reviewStatus!=="published")notFound();
  return <SocialStudio article={article}/>;
}
