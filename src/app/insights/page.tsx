import type { Metadata } from "next";
import Link from "next/link";
import { articles, pillars } from "@/modules/library/articles";

export const metadata: Metadata = {
  title: "Fitness Insights",
  description: "Straightforward fitness guides for decisions you can make today.",
  alternates: { canonical: "/insights" },
};

export default function Insights() {
  const featured = articles[0];
  return (
    <main className="public-page chrome-shell insights-page">
      <p className="kicker">STHENO Insights</p>
      <h1>Fitness advice you can actually use.</h1>
      <p className="lede">
        Training, nutrition, and recovery explained for ordinary weeks—not
        perfect ones.
      </p>
      <nav className="category-pills" aria-label="Insight categories">
        {pillars
          .filter((pillar) => !["tools", "exercises"].includes(pillar.slug))
          .map((pillar) => (
            <Link href={`/library/${pillar.slug}`} key={pillar.slug}>
              {pillar.title}
            </Link>
          ))}
      </nav>
      <Link className="featured-article" href={`/insights/${featured.slug}`}>
        <div>
          <span>Start here · 6 min read</span>
          <h2>{featured.title}</h2>
          <p>{featured.thesis}</p>
          <b>Read the guide →</b>
        </div>
        <div className="editorial-art" aria-hidden="true"><i /><i /><i /></div>
      </Link>
      <section>
        <div className="section-title">
          <div>
            <p className="kicker">Latest guides</p>
            <h2>Pick a question. Get a straight answer.</h2>
          </div>
          <Link href="/tools">Explore free tools →</Link>
        </div>
        <div className="insight-grid">
          {articles.slice(1).map((article) => (
            <Link href={`/insights/${article.slug}`} key={article.slug}>
              <span>{article.pillar.replaceAll("-", " ")} · {article.readMinutes} min</span>
              <h3>{article.title}</h3>
              <p>{article.thesis}</p>
              <b>Read →</b>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
