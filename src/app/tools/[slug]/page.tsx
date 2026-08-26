import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calculator } from "@/components/library/calculator";
import { findTool, tools } from "@/modules/library/tools";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.summary,
    alternates: { canonical: `/tools/${slug}` },
    openGraph: { title: tool.title, description: tool.summary, url: `/tools/${slug}` },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();
  return (
    <main className="public-page shell tool-detail-page">
      <nav className="breadcrumbs">
        <Link href="/library">Library</Link> / <Link href="/tools">Tools</Link> / {tool.title}
      </nav>
      <p className="eyebrow">Free calculator</p>
      <h1>{tool.title}</h1>
      <p className="lede">{tool.summary}</p>
      <Calculator slug={tool.slug} kind={tool.kind} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: tool.title,
            applicationCategory: "HealthApplication",
            isAccessibleForFree: true,
            url: `https://www.sthenofitness.com/tools/${tool.slug}`,
          }).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
