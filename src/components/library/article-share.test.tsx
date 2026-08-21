import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleShare } from "./article-share";

vi.mock("@/lib/analytics/client", () => ({ capture: vi.fn() }));

describe("ArticleShare", () => {
  it("shows accessible icon actions including Instagram", () => {
    render(<ArticleShare articleId="guide" title="Guide" url="https://www.sthenofitness.com/insights/guide" />);
    expect(screen.getByRole("link", { name: "Open STHENO Fitness on Instagram" })).toHaveAttribute("href", "https://www.instagram.com/sthenofitness8/");
    expect(screen.getByRole("link", { name: "Share on X" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Share on LinkedIn" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Share on Facebook" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy article link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open device sharing options" })).toBeInTheDocument();
  });
});
