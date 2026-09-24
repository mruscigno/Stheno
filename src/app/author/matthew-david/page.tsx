import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/modules/library/articles";
import { authorUrl, officialProfiles, publicMetadata, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({ title: "Matthew David — Founder & Author", description: "Meet Matthew David, certified personal trainer, founder of STHENO Fitness, and author of STHENO's practical fitness guides.", path: "/author/matthew-david" });

export default function MatthewDavidPage() {
  return <main className="public-page chrome-shell author-page">
    <p className="kicker">Founder &amp; author</p>
    <h1>Matthew David</h1>
    <p className="lede">Certified Personal Trainer and founder of STHENO Fitness.</p>
    <section><h2>Practical fitness guidance for real life</h2><p>Matthew created STHENO to give people the clarity and direction of good coaching without requiring them to organize their lives around fitness. His editorial work focuses on training, nutrition, recovery, and the decisions that make a plan sustainable.</p><p>STHENO articles explain established fitness principles, identify uncertainty, and distinguish general education from individualized medical care. Recommendations are framed as practical starting points rather than guarantees.</p></section>
    <section><h2>Articles by Matthew</h2><div className="insight-grid">{articles.map(article=><Link key={article.slug} href={`/insights/${article.slug}`}><span>{article.pillar.replaceAll("-"," ")}</span><h3>{article.title}</h3><p>{article.thesis}</p><b>Read →</b></Link>)}</div></section>
    <p><Link href="/editorial-standards">Read STHENO’s editorial standards →</Link></p>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd({"@context":"https://schema.org","@type":"ProfilePage",mainEntity:{"@type":"Person","@id":`${authorUrl}#person`,name:"Matthew David",url:authorUrl,jobTitle:"Founder and Certified Personal Trainer",description:"Founder of STHENO Fitness and author focused on practical training, nutrition, and recovery guidance.",worksFor:{"@id":"https://www.sthenofitness.com/#organization"},sameAs:officialProfiles}})}} />
  </main>;
}
