import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./library.css";
import "./remediation.css";
import "./editorial.css";
import "./process.css";
import "./funnel-v2.css";
import "./home-v2.css";
import "./chrome-overrides.css";
import "./product-13.css";
import "./article-13.css";
import "./visual-remediation.css";
import "./guide-quality.css";
import "./trial-access.css";
import "./mobile-navigation.css";
import {SiteFooter,SiteHeader} from "@/components/public/site-chrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.sthenofitness.com"),
  title: { default: "STHENO Fitness", template: "%s | STHENO Fitness" },
  description: "Evidence-led digital fitness coaching. Your Fitness. Handled.",
  alternates: { canonical: "/" },
  openGraph: { title: "STHENO Fitness", description: "Your Fitness. Handled.", url: "/", siteName: "STHENO Fitness", type: "website" },
  twitter: { card: "summary_large_image", title: "STHENO Fitness", description: "Your Fitness. Handled." },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader/><div id="main-content">{children}</div><SiteFooter/></body>
    </html>
  );
}
