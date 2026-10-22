import { z } from "zod";

const EnvironmentSchema = z.object({
  EXPO_PUBLIC_ENVIRONMENT: z.enum(["development", "staging", "production"]).default("development"),
  EXPO_PUBLIC_API_BASE_URL: z.url().default("https://www.sthenofitness.com"),
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_").min(24),
  EXPO_PUBLIC_ENABLE_ASSESSMENT_SCAFFOLD: z.enum(["true", "false"]).default("true"),
  EXPO_PUBLIC_PROGRESS_V1_ENABLED: z.enum(["true", "false"]).default("false"),
});

export type MobileEnvironment = z.infer<typeof EnvironmentSchema>;

function bundledEnvironment(): Record<string, string | undefined> {
  // Expo only replaces statically referenced EXPO_PUBLIC_* variables in client bundles.
  return {
    EXPO_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT,
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_ENABLE_ASSESSMENT_SCAFFOLD: process.env.EXPO_PUBLIC_ENABLE_ASSESSMENT_SCAFFOLD,
    EXPO_PUBLIC_PROGRESS_V1_ENABLED: process.env.EXPO_PUBLIC_PROGRESS_V1_ENABLED,
  };
}

export function readEnvironment(source: Record<string, string | undefined> = bundledEnvironment()): MobileEnvironment {
  return EnvironmentSchema.parse(source);
}

export function safeEnvironment() {
  const result = EnvironmentSchema.safeParse(bundledEnvironment());
  return result.success ? { config: result.data, error: null } : { config: null, error: result.error };
}
