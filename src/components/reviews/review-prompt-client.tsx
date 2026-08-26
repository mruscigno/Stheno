"use client";
import { useEffect, useState } from "react";
import { capture } from "@/lib/analytics/client";
type Props = { providerName: string; profileUrl: string; milestone: string };
export function ReviewPromptClient({
  providerName,
  profileUrl,
  milestone,
}: Props) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    capture("review_prompt_viewed", { provider: providerName, milestone });
    void fetch("/api/reviews/prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerName, milestone, action: "shown" }),
    });
  }, [milestone, providerName]);
  if (hidden) return null;
  const record = (action: "clicked" | "dismissed") =>
    void fetch("/api/reviews/prompt", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerName, milestone, action }),
    });
  return (
    <aside className="review-prompt">
      <div>
        <p className="eyebrow">Help improve STHENO</p>
        <h2>How is your experience going?</h2>
        <p>
          If you have a moment, share an honest review—positive, critical, or
          somewhere in between.
        </p>
      </div>
      <div className="review-prompt-actions">
        <a
          className="button"
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            capture("review_prompt_clicked", {
              provider: providerName,
              milestone,
            });
            capture("third_party_review_link_clicked", {
              provider: providerName,
            });
            record("clicked");
          }}
        >
          Write an honest review
        </a>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            record("dismissed");
            setHidden(true);
          }}
        >
          Not now
        </button>
      </div>
    </aside>
  );
}
