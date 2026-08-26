import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView, TrackedLink } from "@/components/analytics/tracked-link";
import { breadcrumbJsonLd, publicMetadata, safeJsonLd } from "@/lib/seo";
import {
  comparisons,
  publishedComparisons,
} from "@/modules/comparisons/catalog";

type Props = { params: Promise<{ competitor: string }> };
export function generateStaticParams() {
  return publishedComparisons.map(({ slug }) => ({ competitor: slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params;
  const item = publishedComparisons.find((entry) => entry.slug === competitor);
  return item
    ? publicMetadata({
        title: `STHENO vs ${item.name}`,
        description: `A factual comparison of STHENO personalized fitness coaching and ${item.name}, verified from public first-party sources.`,
        path: `/vs/${item.slug}`,
      })
    : {
        title: "Comparison under review",
        robots: { index: false, follow: false },
      };
}

export default async function VsPage({ params }: Props) {
  const { competitor } = await params;
  const item = comparisons.find((entry) => entry.slug === competitor);
  if (!item?.published || !item.verifiedAt || !item.sourceUrls.length)
    notFound();
  const rows = [
    ["Best suited for", item.bestFor],
    ["Training approach", item.training],
    ["Nutrition and coaching", item.nutrition],
    ["Adapting to real life", item.adaptation],
    ["Access", item.platforms],
    ["Published pricing", item.pricing],
  ];
  return (
    <main className="vs-page chrome-shell">
      <TrackView event="vs_page_viewed" eventProperties={{ competitor: item.slug }} />
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / <Link href="/compare">Compare</Link> /
        STHENO vs {item.name}
      </nav>
      <header>
        <p className="kicker">Fair comparison · verified {item.verifiedAt}</p>
        <h1>STHENO vs {item.name}</h1>
        <p>
          Two different approaches to fitness support. Here is what each service
          publicly offers and who each approach may suit.
        </p>
      </header>
      <div className="vs-grid">
        {rows.map(([title, copy]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{copy}</p>
          </section>
        ))}
      </div>
      <section className="vs-choice">
        <article>
          <h2>Choose {item.name} if…</h2>
          <p>{item.chooseThemIf}</p>
        </article>
        <article>
          <h2>Choose STHENO if…</h2>
          <p>{item.chooseSthenoIf}</p>
        </article>
      </section>
      <aside className="comparison-sources">
        <strong>Verification and sources</strong>
        <p>
          Product details can change. This comparison uses public information
          from the provider sources below. Product names and trademarks belong
          to their respective owners.
        </p>
        <ul>
          {item.sourceUrls.map((url, index) => (
            <li key={url}>
              <a href={url} rel="noreferrer">
                Official {item.name} source {index + 1}
              </a>
            </li>
          ))}
        </ul>
      </aside>
      <TrackedLink
        event="vs_assessment_click"
        eventProperties={{ competitor: item.slug }}
        className="button button-large"
        href="/assessment"
      >
        Build my free STHENO plan →
      </TrackedLink>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbJsonLd([
              ["Home", "/"],
              ["Compare", "/compare"],
              [`STHENO vs ${item.name}`, `/vs/${item.slug}`],
            ]),
          ),
        }}
      />
    </main>
  );
}
