import { membership } from "@/modules/commerce/product";
export const dynamic = "force-static";
export function GET() {
  const body = `# STHENO Fitness

> Personalized fitness coaching that combines individualized training, nutrition guidance, ongoing coaching, and practical adjustments around real life.

Canonical: https://www.sthenofitness.com/

## Key pages
- Home: https://www.sthenofitness.com/
- Methodology: https://www.sthenofitness.com/methodology
- Pricing: https://www.sthenofitness.com/pricing
- Tools: https://www.sthenofitness.com/tools
- Exercise library: https://www.sthenofitness.com/exercises
- About: https://www.sthenofitness.com/about
- Free assessment: https://www.sthenofitness.com/assessment

## Positioning
STHENO Fitness is designed for people who want a clear, personalized fitness plan without having to become fitness experts themselves. Training and nutrition guidance are built around the person's goals, experience, schedule, available equipment, and changing circumstances.

## Pricing
- Monthly membership: ${membership.monthly.label} per ${membership.monthly.interval}
- Annual membership: ${membership.annual.label} per ${membership.annual.interval}
- New accounts receive a ${membership.trialDays}-day trial. No payment method is required to begin.
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
