"use client";
import { useState } from "react";
import { capture } from "@/lib/analytics/client";

function ShareIcon({ name }: { name: "instagram" | "x" | "linkedin" | "facebook" | "copy" | "share" }) {
  const paths = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.25"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></>,
    x: <path d="M5 4l14 16M19 4L5 20"/>,
    linkedin: <><path d="M7 9v11M7 6v.01M11 20v-6.2c0-2.1 3-2.4 3 0V20M11 9v11M17 20v-6.8c0-5.1-6-4.5-6-.4"/></>,
    facebook: <path d="M14 21v-8h3l.5-4H14V7.5c0-1.2.4-2 2-2H18V2.2c-.7-.1-1.6-.2-2.8-.2-3 0-5.2 1.9-5.2 5.4V9H7v4h3v8"/>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    share: <><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.5M8.2 13.2l7.6 4.5"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function ArticleShare({ articleId, title, url, instagramCaption }: { articleId: string; title: string; url: string; instagramCaption: string }) {
  const [copied, setCopied] = useState(false);
  const [instagramOpen, setInstagramOpen] = useState(false);
  const [instagramStatus, setInstagramStatus] = useState("");
  const track = (platform: string) => capture("article_reader_share_clicked", { article_id: articleId, platform, source_screen: "article_reader" });
  const share = async () => { track("native"); if (navigator.share) await navigator.share({ title, url }).catch(() => undefined); else { await navigator.clipboard.writeText(url); setCopied(true); } };
  const prepareInstagram = async (format: "instagram_post" | "instagram_story") => {
    setInstagramStatus("Preparing your graphic…");
    track(format);
    try {
      const assetUrl = `/api/social/assets/${articleId}?${new URLSearchParams({ platform: format, template: format === "instagram_story" ? "story-cover" : "editorial-hero" })}`;
      const response = await fetch(assetUrl);
      if (!response.ok) throw new Error("asset");
      const blob = await response.blob();
      const filename = `${articleId}-${format === "instagram_story" ? "story" : "post"}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      await navigator.clipboard?.writeText(instagramCaption).catch(() => undefined);
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title, text: instagramCaption, files: [file] });
        setInstagramStatus("Graphic shared. The caption is also copied for Instagram.");
      } else {
        const downloadUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(downloadUrl);
        setInstagramStatus("Graphic downloaded and caption copied. Open Instagram to finish the post.");
      }
    } catch {
      setInstagramStatus("Instagram preparation was cancelled or interrupted. Try again when ready.");
    }
  };
  return <aside className="article-share" aria-label="Share this article">
    <strong>Share this guide</strong>
    <div className="article-share-instagram">
      <button type="button" aria-label="Prepare for Instagram" title="Instagram" aria-expanded={instagramOpen} onClick={() => { setInstagramOpen((open) => !open); setInstagramStatus(""); }}><ShareIcon name="instagram"/></button>
      {instagramOpen && <div className="article-share-instagram-menu" aria-label="Choose an Instagram format">
        <button type="button" onClick={() => void prepareInstagram("instagram_post")}>Post <small>1080×1350</small></button>
        <button type="button" onClick={() => void prepareInstagram("instagram_story")}>Story <small>1080×1920</small></button>
      </div>}
    </div>
    <a href={`https://x.com/intent/post?${new URLSearchParams({ text: title, url })}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" title="X" onClick={() => track("x")}><ShareIcon name="x"/></a>
    <a href={`https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url })}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" title="LinkedIn" onClick={() => track("linkedin")}><ShareIcon name="linkedin"/></a>
    <a href={`https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" title="Facebook" onClick={() => track("facebook")}><ShareIcon name="facebook"/></a>
    <button type="button" aria-label={copied ? "Link copied" : "Copy article link"} title={copied ? "Copied" : "Copy link"} onClick={() => void navigator.clipboard.writeText(url).then(() => { setCopied(true); track("copy_link"); })}><ShareIcon name="copy"/></button>
    <button type="button" aria-label="Open device sharing options" title="Share" onClick={() => void share()}><ShareIcon name="share"/></button>
    {instagramStatus && <p className="article-share-status" role="status">{instagramStatus}{instagramStatus.includes("downloaded") && <> <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Open Instagram</a></>}</p>}
  </aside>;
}
