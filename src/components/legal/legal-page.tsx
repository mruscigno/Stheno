import type { ReactNode } from "react";

export function LegalPage({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary: string; children: ReactNode }) {
  return <main className="legal-page shell">
    <header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{summary}</p></header>
    <article>{children}</article>
    <aside><strong>Legal review status</strong><p>This document is a good-faith operational template prepared for qualified legal review. It is not labeled attorney-reviewed.</p></aside>
  </main>;
}

