# Marketing repositioning integration map

## Current homepage inventory and decision

| Current section            | Decision                                                                  | Reuse                                               |
| -------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| Hero + training photograph | Change positioning and replace stock-led proof with connected product UI  | Existing CTA tracking and brand tokens              |
| Product proof scenarios    | Consolidate into adaptation section; remove unsupported automatic wording | Scenario data shapes                                |
| Blueprint                  | Change into four-step “How it works”                                      | Assessment funnel copy                              |
| Three simplicity promises  | Expand to four product promises                                           | Existing card rhythm                                |
| Training                   | Keep and strengthen with faithful workout UI                              | `WorkoutMini`                                       |
| Nutrition                  | Change to live daily logging demonstration                                | Current nutrition tracker data shape                |
| Adaptation                 | Keep with explicitly confirmed/reviewed changes                           | Existing supported scenarios                        |
| Coach                      | Keep; describe answers and proposed changes without diagnosis             | Existing Coach orchestration                        |
| Progress                   | Keep; show illustrative, clearly labeled product data                     | Existing progress presentation                      |
| Evidence                   | Keep within trust/resources                                               | Methodology route                                   |
| Free tools                 | Keep, shorten to three featured tools                                     | `tools` content source                              |
| Exercise proof             | Remove from homepage to control length; retain library link               | Production exercise library remains at `/exercises` |
| Learn                      | Keep, shorten to three articles                                           | `articles` content source                           |
| Pricing                    | Keep and read values from commerce source                                 | `membership`, `annualSavings`                       |
| FAQ                        | Keep visible FAQ and schema                                               | `homepageFaqItems`, `FaqList`                       |
| Final CTA                  | Change to mandated positioning                                            | Assessment route                                    |

## Existing architecture

- Reusable components: `TrackedLink`, `TrackView`, `FaqList`, `SthenoLogo`, global `SiteHeader` and `SiteFooter`.
- Logo source: `src/components/brand/stheno-logo.tsx`; orange treatment comes from `brand-refresh.css` and `logo-account-library.css`.
- Design tokens: bright/off-white/orange marketing palette in `product-14.css`, `brand-refresh.css`, and global variables.
- Primary assessment CTA: `/assessment`; live path is homepage → assessment → blueprint/result → account/trial.
- Pricing source: `src/modules/commerce/product.ts`, backed by configured monthly/annual product values. No homepage literal controls price.
- Analytics: `TrackView`, `TrackedLink`, PostHog/HeyCatch-compatible allow-listed events in `src/modules/analytics/events.ts`.
- SEO/schema: `publicMetadata`, `Organization`, `WebSite`, and `Service` JSON-LD from `src/lib/seo.ts`; visible FAQ data is reusable for FAQ schema.
- Mobile issues to solve: long page, stock-heavy hero, dense five-column coaching loop, product screenshots that become too small, and duplicated proof sections.
- Authenticated application, assessment, nutrition, Progress, Coach, monthly check-ins, and progress photos are reused without modification.

## Capability truth source

The homepage consumes `src/modules/marketing/capabilities.ts`. Only `LIVE` items are rendered as available. Barcode, photo meal estimation, and saved meals are not marketed as live.

Progress photos: existing implementation reused; no duplicate implementation.
