"use client";
import type { FaqItem } from "@/modules/content/faq";
import { capture } from "@/lib/analytics/client";

export function FaqList({
  items,
  grouped = false,
}: {
  items: FaqItem[];
  grouped?: boolean;
}) {
  const groups = grouped
    ? items.reduce<Record<string, FaqItem[]>>((result, item) => {
        (result[item.category] ??= []).push(item);
        return result;
      }, {})
    : { Questions: items };
  return (
    <div className={grouped ? "faq-groups" : "faq-list"}>
      {Object.entries(groups).map(([category, entries]) =>
        entries?.length ? (
          <section key={category}>
            {grouped ? <h2>{category}</h2> : null}
            {entries.map((item) => (
              <details
                key={item.id}
                onToggle={(event) => {
                  if (event.currentTarget.open) {
                    capture("faq_opened", { question: item.id });
                    if (item.id === "free-apps")
                      capture("free_apps_faq_opened", {
                        location: grouped ? "faq" : "homepage",
                      });
                  }
                }}
              >
                <summary>
                  {item.question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        ) : null,
      )}
    </div>
  );
}
