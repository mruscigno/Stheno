import type { Metadata } from "next";
import { MarketingHomepage } from "@/app/page";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Explore STHENO Fitness",
  description: "Explore STHENO training, nutrition, progress, coaching, exercise guidance, pricing and free fitness resources.",
  path: "/explore",
});

export default function ExplorePage() {
  return <MarketingHomepage />;
}
