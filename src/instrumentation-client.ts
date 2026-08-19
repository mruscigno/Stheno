import { analytics } from "@heycatch/sdk";
import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

analytics.init({
  projectKey: "hck_pk_dHLKWbUi7UUrnBvLWuJJn60N1J7eHAiq",
  install: {
    framework: "nextjs",
    frameworkVersion: "16",
    agent: "codex",
  },
});
