import { describe, expect, it } from "vitest";
import { readEnvironment } from "./env";

const valid = { EXPO_PUBLIC_ENVIRONMENT: "staging", EXPO_PUBLIC_API_BASE_URL: "https://staging.example.com", EXPO_PUBLIC_SUPABASE_URL: "https://project.supabase.co", EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abcdefghijklmnopqrstuvwxyz", EXPO_PUBLIC_ENABLE_ASSESSMENT_SCAFFOLD: "true" };
describe("mobile environment boundary", () => {
  it("accepts only public runtime configuration", () => expect(readEnvironment(valid)).toMatchObject({ EXPO_PUBLIC_ENVIRONMENT: "staging" }));
  it("rejects legacy or privileged-looking keys in the publishable slot", () => expect(() => readEnvironment({ ...valid, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "service_role_secret" })).toThrow());
});
