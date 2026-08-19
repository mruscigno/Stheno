import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { comparisons, publishedComparisons } from "@/modules/comparisons/catalog";
export function generateStaticParams() { return publishedComparisons.map(({ slug }) => ({ competitor: slug })); }
export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> { const { competitor } = await params; const item = publishedComparisons.find((entry)=>entry.slug===competitor); return item ? { title: `STHENO vs ${item.name}`, robots: { index: true, follow: true } } : { title: "Comparison unavailable", robots: { index: false, follow: false } }; }
export default async function ComparisonPage({ params }: { params: Promise<{ competitor: string }> }) { const { competitor } = await params; const item = comparisons.find((entry)=>entry.slug===competitor); if (!item?.published || !item.verifiedAt || !item.sourceUrls.length) notFound(); permanentRedirect(`/vs/${item.slug}`); }
