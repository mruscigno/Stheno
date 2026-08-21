"use client";
import { useState } from "react";
import { capture } from "@/lib/analytics/client";

export function ArticleShare({ articleId, title, url }: { articleId: string; title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const track = (platform: string) => capture("article_reader_share_clicked", { article_id: articleId, platform, source_screen: "article_reader" });
  const share = async () => { track("native"); if (navigator.share) await navigator.share({ title, url }).catch(() => undefined); else { await navigator.clipboard.writeText(url); setCopied(true); } };
  return <aside className="article-share" aria-label="Share this article">
    <strong>Share this guide</strong>
    <a href={`https://x.com/intent/post?${new URLSearchParams({ text: title, url })}`} target="_blank" rel="noopener noreferrer" onClick={() => track("x")}>X</a>
    <a href={`https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url })}`} target="_blank" rel="noopener noreferrer" onClick={() => track("linkedin")}>LinkedIn</a>
    <a href={`https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}`} target="_blank" rel="noopener noreferrer" onClick={() => track("facebook")}>Facebook</a>
    <button type="button" onClick={() => void navigator.clipboard.writeText(url).then(() => { setCopied(true); track("copy_link"); })}>{copied ? "Copied" : "Copy link"}</button>
    <button type="button" onClick={() => void share()}>Share</button>
  </aside>;
}
