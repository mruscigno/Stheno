import { z } from "zod";

export const BLUEPRINT_MARKETING_CONSENT_VERSION = "blueprint-marketing-v1";

export const blueprintEmailRequestSchema = z.object({
  email: z.email().max(254),
  marketingConsent: z.boolean().default(false),
  website: z.string().max(0).default(""),
  attribution: z.object({
    sessionId: z.string().max(100).optional(),
    source: z.string().max(100).optional(),
    medium: z.string().max(100).optional(),
    campaign: z.string().max(160).optional(),
  }).optional(),
  summary: z.object({
    goalLabel: z.string().min(1).max(100),
    strategy: z.string().min(1).max(500),
    days: z.number().int().min(1).max(7),
    focus: z.string().min(1).max(240),
    structure: z.string().min(1).max(200),
    duration: z.number().int().min(10).max(180),
    proteinLow: z.number().int().min(0).max(500),
    proteinHigh: z.number().int().min(0).max(500),
    calorieDirection: z.string().min(1).max(240),
  }).refine((value) => value.proteinHigh >= value.proteinLow, {
    message: "Protein range is invalid.",
    path: ["proteinHigh"],
  }),
});

export type BlueprintEmailRequest = z.infer<typeof blueprintEmailRequestSchema>;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

export function buildBlueprintEmail(input: BlueprintEmailRequest, appUrl: string) {
  const s = input.summary;
  const rows = [
    ["Training schedule", `${s.days} days per week`],
    ["Structure", s.structure],
    ["Session length", `${s.duration} minutes`],
    ["Training focus", s.focus],
    ["Daily protein range", `${s.proteinLow}–${s.proteinHigh}g`],
    ["Nutrition direction", s.calorieDirection],
  ];
  const rowHtml = rows.map(([label, value]) => `<tr><td style="padding:10px 0;color:#6a6258;font-size:13px;vertical-align:top;width:34%">${escapeHtml(label)}</td><td style="padding:10px 0;color:#171714;font-size:15px;font-weight:600;vertical-align:top">${escapeHtml(value)}</td></tr>`).join("");
  const consentLine = input.marketingConsent
    ? "You also asked to receive occasional STHENO training, nutrition, and product emails. You can unsubscribe at any time."
    : "This delivery does not subscribe you to marketing emails.";
  return {
    subject: `Your STHENO Blueprint: ${s.goalLabel}`,
    text: `YOUR FITNESS. HANDLED.\n\n${s.goalLabel}\n${s.strategy}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nCreate your account: ${appUrl}/signup?next=/app\n\n${consentLine}\n\nEducational guidance only—not medical advice.`,
    html: `<div style="margin:0;background:#f5f1e9;padding:32px 16px;font-family:Arial,sans-serif;color:#171714"><div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #ded6ca;border-radius:18px;overflow:hidden"><div style="padding:28px 32px;background:#171714;color:#fff"><p style="margin:0 0 8px;color:#ff5a1f;font-size:12px;font-weight:800;letter-spacing:.14em">YOUR FITNESS. HANDLED.</p><h1 style="margin:0;font-size:30px;line-height:1.1">${escapeHtml(s.goalLabel)}</h1></div><div style="padding:28px 32px"><p style="margin:0 0 24px;color:#4e4942;font-size:17px;line-height:1.55">${escapeHtml(s.strategy)}</p><table role="presentation" style="width:100%;border-collapse:collapse;border-top:1px solid #e8e1d7;border-bottom:1px solid #e8e1d7">${rowHtml}</table><p style="margin:26px 0"><a href="${appUrl}/signup?next=/app" style="display:inline-block;background:#ff5a1f;color:#171714;text-decoration:none;font-weight:800;padding:14px 20px;border-radius:999px">Create my STHENO account</a></p><p style="margin:24px 0 0;color:#6a6258;font-size:12px;line-height:1.5">${escapeHtml(consentLine)}</p><p style="margin:10px 0 0;color:#6a6258;font-size:12px;line-height:1.5">Educational guidance only—not medical advice.</p></div></div></div>`,
  };
}
