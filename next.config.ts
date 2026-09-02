import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects(){return [
    {source:"/f",destination:"/start?source=facebook&entry=/f",permanent:false},
    {source:"/i",destination:"/start?source=instagram&entry=/i",permanent:false},
    {source:"/l",destination:"/start?source=linkedin&entry=/l",permanent:false},
    {source:"/r",destination:"/start?source=reddit&entry=/r",permanent:false},
    {source:"/t",destination:"/start?source=tiktok&entry=/t",permanent:false},
    {source:"/x",destination:"/start?source=x&entry=/x",permanent:false},
    {source:"/y",destination:"/start?source=youtube&entry=/y",permanent:false},
  ]},
  async headers(){return [{source:"/:path*",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},{key:"X-Frame-Options",value:"DENY"},{key:"Strict-Transport-Security",value:"max-age=63072000; includeSubDomains; preload"}]}]},
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
