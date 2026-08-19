import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/public/faq-list";
import { faqItems } from "@/modules/content/faq";
import { breadcrumbJsonLd, publicMetadata, safeJsonLd, siteUrl } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({ title: "Fitness Coaching FAQ", description: "Answers about STHENO personalized training, nutrition guidance, coaching, membership, billing, and account data.", path: "/faq" });

export default function FaqPage() {
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", "@id": `${siteUrl}/faq#faq`, mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  return <main className="faq-page chrome-shell"><header><p className="kicker">STHENO FAQ</p><h1>Clear answers before you begin.</h1><p>How personalized coaching, training, nutrition guidance, membership, and your account work.</p></header><FaqList items={faqItems} grouped/><aside className="faq-next"><h2>Still deciding?</h2><p>Compare the kind of support different fitness services provide, or see what STHENO builds from your starting point.</p><div><Link className="button secondary" href="/compare">Compare STHENO</Link><Link className="button" href="/assessment">Take the free assessment</Link></div></aside><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd([faqSchema, breadcrumbJsonLd([["Home", "/"], ["FAQ", "/faq"]])]) }}/></main>;
}
