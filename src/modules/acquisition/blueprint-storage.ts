import type { Blueprint } from "./blueprint";

export type StoredBlueprint = Blueprint & {
  createdAt?: string;
  input?: unknown;
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeStoredBlueprint(value: unknown): StoredBlueprint | null {
  if (!record(value)) return null;

  const candidate = record(value.blueprint) ? value.blueprint : value;
  if (
    typeof candidate.goalLabel !== "string" ||
    typeof candidate.strategy !== "string" ||
    typeof candidate.version !== "string" ||
    !record(candidate.training) ||
    typeof candidate.training.days !== "number" ||
    !Array.isArray(candidate.training.week) ||
    !record(candidate.nutrition) ||
    !Array.isArray(candidate.nutrition.proteinGrams) ||
    !record(candidate.activity) ||
    !Array.isArray(candidate.priorities) ||
    !Array.isArray(candidate.trajectory)
  ) {
    return null;
  }

  return {
    ...(candidate as Blueprint),
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : typeof candidate.createdAt === "string"
          ? candidate.createdAt
          : undefined,
    input: value.input ?? candidate.input,
  };
}
