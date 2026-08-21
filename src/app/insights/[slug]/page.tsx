import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleWorkbook } from "@/components/library/article-workbook";
import { articles, findArticle } from "@/modules/library/articles";
import { guidance } from "@/modules/library/article-content";
import { depth } from "@/modules/library/article-depth";
import { extended } from "@/modules/library/article-extended";
import { findTool } from "@/modules/library/tools";
import { ArticleShare } from "@/components/library/article-share";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasEditorialAccess } from "@/lib/editorial/access";
import { articleCaption } from "@/modules/social-studio/captions";
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params,
    a = findArticle(slug);
  return a
    ? {
        title: a.title,
        description: a.description,
        alternates: { canonical: `/insights/${slug}` },
        openGraph: {
          title: a.title,
          description: a.description,
          url: `/insights/${slug}`,
          type: "article",
        },
      }
    : {};
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    a = findArticle(slug),
    g = guidance[slug];
  if (!a || !g) notFound();
  const d = depth[a.pillar],
    x = extended[a.pillar],
    tool = findTool(a.relatedTool),
    related = articles
      .filter((item) => item.pillar === a.pillar && item.slug !== a.slug)
      .slice(0, 3);
  const db=await createSupabaseServerClient(),{data:{user}}=db?await db.auth.getUser():{data:{user:null}},canEdit=await hasEditorialAccess(user);
  return (
    <main className="article-new">
      <header className="article-hero chrome-shell">
        <nav className="breadcrumbs">
          <Link href="/insights">Insights</Link> /{" "}
          {a.pillar.replaceAll("-", " ")}
        </nav>
        <p className="kicker">{a.pillar.replaceAll("-", " ")}</p>
        <h1>{a.title}</h1>
        <p>{a.thesis}</p>
        <div className="article-meta">
          <span>By {a.author}</span>
          <span>{a.readMinutes} min read</span>
          <span>Updated Aug 18, 2026</span>
        </div>
        {canEdit?<Link className="button secondary" href={`/app/social-studio/${a.slug}`}>Open Social Studio</Link>:null}
      </header>
      <div className="article-layout chrome-shell">
        <aside>
          <strong>In this guide</strong>
          <a href="#start">Start here</a>
          <a href="#why">Why it works</a>
          <a href="#decide">Make the decision</a>
          <a href="#example">Practical example</a>
          <a href="#apply">Apply it</a>
          <a href="#measure">What to measure</a>
          <a href="#special">Special cases</a>
          <a href="#adjust">How to adjust</a>
          <a href="#workbook">Four-week protocol</a>
          <a href="#evidence">Evidence notes</a>
        </aside>
        <article>
          <ArticleShare articleId={a.slug} title={a.title} url={`https://www.sthenofitness.com/insights/${a.slug}`} instagramCaption={articleCaption(a,"instagram_post")}/>
          <details className="article-mobile-toc">
            <summary>In this guide</summary>
            <nav>
              <a href="#start">Start here</a><a href="#why">Why it works</a>
              <a href="#decide">Make the decision</a><a href="#example">Practical example</a>
              <a href="#apply">Apply it</a><a href="#measure">What to measure</a>
              <a href="#special">Special cases</a><a href="#adjust">How to adjust</a>
              <a href="#workbook">Four-week protocol</a><a href="#evidence">Evidence notes</a>
            </nav>
          </details>
          <p className="article-lead">
            {a.thesis} The useful question is not what looks most impressive on
            paper. It is what decision you can make today, observe honestly, and
            still support next week.
          </p>
          <h2 id="start">Start here</h2>
          <p>{g.first}</p>
          <p>
            Use this as a starting experiment rather than a permanent rule.
            Record what you did, how it felt, and whether performance and
            recovery remain steady. Context matters: experience, equipment,
            time, preferences, health, and competing demands can all change the
            right dose without changing the underlying principle.
          </p>
          <div className="article-callout">
            <strong>STHENO principle</strong>
            <p>
              Make the smallest useful change, keep it long enough to observe,
              and adjust from evidence rather than emotion.
            </p>
          </div>
          <h2 id="why">Why this works</h2>
          <p>{d.mechanism}</p>
          <p>
            The mechanism does not produce a perfectly predictable result for
            every person. Research describes averages and ranges; individual
            response still has to be observed. Treat estimates as navigational
            aids, not promises.
          </p>
          <h2 id="decide">Turn the principle into a decision</h2>
          <p>{d.decision}</p>
          <p>
            Write the decision in behavioral terms. “Train consistently” is
            vague. “Complete Monday and Thursday full-body sessions, with
            Saturday as the backup” can be acted on. Good guidance reduces the
            choices required when motivation is lowest.
          </p>
          <h2 id="example">A practical example</h2>
          <p>{g.example}</p>
          <p>
            A useful plan leaves room for normal variation. Judge the direction
            across several exposures instead of treating one result as a
            verdict. If the example does not fit your circumstances, preserve
            its purpose and change its logistics.
          </p>
          <h2 id="apply">Apply it in the real week</h2>
          <p>{x.application}</p>
          <div className="article-table-scroll" role="region" aria-label="Decision examples" tabIndex={0}><table className="article-decision-table">
            <thead>
              <tr>
                <th>What you observe</th>
                <th>Useful next decision</th>
              </tr>
            </thead>
            <tbody>
              {x.checks.map(([signal, decision]) => (
                <tr key={signal}>
                  <td>{signal}</td>
                  <td>{decision}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <h2 id="measure">What to measure—and what to ignore</h2>
          <p>{d.measure}</p>
          <p>
            Measurement should earn its place by improving a decision. More data
            can create false certainty when the input is noisy or the time
            window is too short. Choose a few signals, collect them
            consistently, and decide in advance what change would matter.
          </p>
          <h2 id="special">Nuance and special cases</h2>
          <p>{x.specialCases}</p>
          <h2>How STHENO applies the principle</h2>
          <p>{x.stheno}</p>
          <h2 id="watch">What to watch</h2>
          <p>{g.watch}</p>
          <p>{d.myth}</p>
          <p>
            Sharp pain, chest pain, faintness, neurological symptoms, or unusual
            shortness of breath are not programming puzzles. Stop and seek
            appropriate qualified care. Educational content cannot evaluate
            symptoms or account for an individual medical history.
          </p>
          <h2 id="adjust">How to adjust without starting over</h2>
          <p>{d.adjust}</p>
          <p>
            Keep everything else as stable as practical after an adjustment.
            When five variables change together, the result may change but you
            will not know why. The goal is enough consistency to make the next
            choice less arbitrary.
          </p>
          <ArticleWorkbook topic={a.title} principle={g.takeaway} />
          <h2 id="bottom-line">The bottom line</h2>
          <p>{g.takeaway}</p>
          <p>
            Consistency is not rigid perfection. It is the ability to return to
            a useful pattern, notice when it no longer fits, and change it
            without abandoning the underlying goal.
          </p>
          <section className="evidence-notes" id="evidence">
            <h2>Evidence and editorial notes</h2>
            <p>
              This guide is educational content written by STHENO Editorial. It
              has not been represented as independent medical review. The
              sources below inform the general principles; they do not validate
              a personalized prescription for every reader.
            </p>
            <ul>
              {d.evidence.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
            <p>
              <strong>Method:</strong> practical recommendations are expressed
              as starting ranges and decision rules. Evidence version{" "}
              {a.evidenceVersion}; methodology {a.methodologyVersion}.
            </p>
          </section>
          <div className="article-cta">
            <p>
              Want STHENO to build this around your schedule, equipment, and
              starting point?
            </p>
            <Link className="button" href="/assessment">
              Build my free plan →
            </Link>
          </div>
        </article>
        <aside className="related-rail">
          <strong>Use the idea</strong>
          {tool ? (
            <Link href={`/tools/${tool.slug}`}>
              <span>Related tool</span>
              {tool.title} →
            </Link>
          ) : null}
          <Link href="/exercises">
            <span>Exercise library</span>Browse 330 movements →
          </Link>
        </aside>
      </div>
      <section className="related-section chrome-shell">
        <p className="kicker">Keep learning</p>
        <h2>Related guides</h2>
        <div className="insight-grid">
          {related.map((item) => (
            <Link href={`/insights/${item.slug}`} key={item.slug}>
              <span>{item.pillar.replaceAll("-", " ")}</span>
              <h3>{item.title}</h3>
              <b>Read →</b>
            </Link>
          ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.description,
            author: { "@type": "Organization", name: a.author },
            dateModified: a.updatedAt,
            mainEntityOfPage: `https://www.sthenofitness.com/insights/${a.slug}`,
          }).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
