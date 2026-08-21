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
import "./social-studio.css";
import "./article-share.css";
import "./product-14.css";
import "./heycatch.css";
import "./brand-refresh.css";
import "./product-16.css";
import "./logo-account-library.css";
import {SiteFooter,SiteHeader} from "@/components/public/site-chrome";
import { defaultSocialImage } from "@/lib/seo";
import { HeyCatchIdentity } from "@/components/analytics/heycatch-identity";

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
  title: { default: "STHENO Fitness | Personalized Fitness Coaching & Training Plans", template: "%s | STHENO Fitness" },
  description: "Personalized workouts, nutrition guidance, and ongoing coaching built around your goals, schedule, equipment, and real life.",
  alternates: { canonical: "/" },
  openGraph: { title: "STHENO Fitness | Personalized Fitness Coaching", description: "Your fitness. Handled. Personalized training, nutrition, and coaching that adapts to real life.", url: "/", siteName: "STHENO Fitness", type: "website", images: [defaultSocialImage] },
  twitter: { card: "summary_large_image", title: "STHENO Fitness | Personalized Fitness Coaching", description: "Your fitness. Handled. Personalized training, nutrition, and coaching that adapts to real life.", images: [defaultSocialImage.url] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body><HeyCatchIdentity/><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader/><div id="main-content">{children}</div><SiteFooter/></body>
    </html>
  );
}
