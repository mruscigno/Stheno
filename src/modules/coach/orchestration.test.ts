import { describe, expect, it } from "vitest";
import { actionIntent, answerQuality, classifyCoachRequest, OUT_OF_DOMAIN, safetyResponse } from "./orchestration";

const fitnessSeeds = [
  "Would it be better to work out 5 days a week?", "What exercises are best for a big back?", "How do I grow my lats?", "Should I train chest twice a week?", "Is three days enough to build muscle?", "How much protein should I eat?", "Should I take creatine?", "What should I eat before a morning workout?", "Why am I not getting stronger?", "How long should I rest between sets?", "Should I train to failure?", "Can I run and lift on the same day?", "What’s a good exercise for side delts?", "My gym doesn’t have a leg press. What can I do instead?", "I only have 30 minutes for my workout today.", "Should I add another arm day?", "What rep range should I use?", "How many sets per week for back?", "Is soreness a sign of a good workout?", "How much sleep do I need for recovery?", "Should I lift more days?", "Can I train five days?", "What grows your back?", "Best back exercises?", "How do I make my lats wider?", "Is 3 days enough for strength?", "Should I do cardio on leg day?", "What should I eat before lifting?", "Is creatine worth it?", "Why am I sore?",
];
const variations = ["", " I am a beginner.", " My goal is muscle gain.", " I train at home."];
const fitnessPrompts = fitnessSeeds.flatMap((seed) => variations.map((suffix) => seed + suffix));

describe("coach orchestration", () => {
  it("answers more than 100 normal fitness questions without false refusal", () => {
    expect(fitnessPrompts.length).toBeGreaterThanOrEqual(100);
    for (const prompt of fitnessPrompts) expect(classifyCoachRequest(prompt), prompt).not.toBe("out_of_domain");
  });
  it.each(["Who should I start in fantasy football?", "Write Python code for a web scraper.", "Who is the president?", "Recommend a horror movie.", "Plan my vacation to Italy.", "What is the capital of France?"])("refuses unrelated: %s", (prompt) => expect(classifyCoachRequest(prompt)).toBe("out_of_domain"));
  it.each(["My chest hurts during exercise.", "I fainted at the gym.", "My shoulder pain is getting worse.", "Can I lose 20 pounds in two weeks?"])("routes safety separately: %s", (prompt) => expect(classifyCoachRequest(prompt)).toBe("safety"));
  it("keeps the concise refusal contract", () => expect(OUT_OF_DOMAIN.length).toBeLessThan(180));
  it("routes actions before generation", () => expect(classifyCoachRequest("shorten today's workout")).toBe("action"));
  it("uses urgent safety copy for red flags", () => expect(safetyResponse("chest pain").classification).toBe("stop"));
  it("preserves travel scope", () => expect(actionIntent("adapt my plan for travel").scope).toBe("week"));
  it("fails sludge", () => expect(answerQuality("Great question! Fitness is a journey.").passes).toBe(false));
});
