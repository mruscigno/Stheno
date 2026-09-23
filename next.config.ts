import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { socialRedirects } from "./src/modules/acquisition/short-routes";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects(){return [...socialRedirects]},
  async headers(){return [{source:"/:path*",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},{key:"X-Frame-Options",value:"DENY"},{key:"Strict-Transport-Security",value:"max-age=63072000; includeSubDomains; preload"}]}]},
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
