# Environments

Local uses `.env.local`, pull requests use Vercel Preview variables, and `main` uses Production variables. Copy `.env.example` locally and never commit values.

Public: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SENTRY_DSN`.

Server only: `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

Supabase Auth redirect allow-list should include `http://localhost:3000/auth/callback`, the Vercel preview wildcard, and `https://www.sthenofitness.com/auth/callback`. Configure monthly and annual Stripe price IDs per environment. Never reuse production credentials in preview/local.
