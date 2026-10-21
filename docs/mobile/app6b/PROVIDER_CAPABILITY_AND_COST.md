# Provider capability and cost

No production video-analysis provider is approved. The existing model integration is text-oriented and does not establish a reviewed, no-extra-cost, privacy-approved recorded-video pipeline. Therefore `FORM_REVIEW_PROCESSING_ENABLED` and `FORM_REVIEW_PUBLIC_ENABLED` default to false and are not being enabled in Vercel.

Storage and transfer would consume the existing Supabase allowance, bounded at 75 MB per clip and four clips per member per month. Provider cost is $0 while disabled. A provider-specific cost model, retention policy, subprocessors, regional handling, quality evaluation, and founder approval are required before activation.

