import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export function configurationStatus() {
  return {
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    database: Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    resend: Boolean(process.env.RESEND_API_KEY),
    posthog: Boolean(publicEnv.NEXT_PUBLIC_POSTHOG_KEY),
    sentry: Boolean(publicEnv.NEXT_PUBLIC_SENTRY_DSN),
    appVersion: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "development",
    engineVersion: "0.1.0",
  } as const;
}
