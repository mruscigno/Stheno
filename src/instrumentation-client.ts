import { analytics } from "@heycatch/sdk";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

analytics.init({
  projectKey: "hck_pk_dHLKWbUi7UUrnBvLWuJJn60N1J7eHAiq",
  install: {
    framework: "nextjs",
    frameworkVersion: "16",
    agent: "codex",
  },
});

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    person_profiles: "identified_only",
    persistence: "localStorage+cookie",
  });
}
