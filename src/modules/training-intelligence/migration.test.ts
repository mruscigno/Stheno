import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(join(process.cwd(), "supabase/migrations/20260823202127_competitive_gap_training_intelligence.sql"), "utf8").toLowerCase();
const backfill = readFileSync(join(process.cwd(), "supabase/migrations/20260823203938_competitive_gap_safe_pr_workload_backfill.sql"), "utf8").toLowerCase();

describe("competitive gap migrations", () => {
  it.each(["training_load_recommendations", "exercise_performance_metrics", "muscle_workload_weekly", "training_achievements"])("creates and protects %s", table => {
    expect(schema).toContain(`create table if not exists public.${table}`);
    expect(schema).toContain(`'${table}'`);
    expect(schema).toContain("enable row level security");
    expect(schema).toContain("(select auth.uid()) = user_id");
  });

  it("extends the existing workout domain additively", () => {
    expect(schema).toContain("workout_set_logs_set_type_check");
    expect(schema).toContain("add column if not exists prescribed_load");
    expect(schema).toContain("add column if not exists session_effort");
    expect(schema).not.toMatch(/drop\s+table/);
    expect(schema).not.toMatch(/delete\s+from\s+public\.workout_set_logs/);
  });

  it("backfills derived data without mutating source workout records", () => {
    expect(backfill).toContain("insert into public.personal_records");
    expect(backfill).toContain("insert into public.muscle_workload_weekly");
    expect(backfill).not.toMatch(/update\s+public\.workout_set_logs/);
    expect(backfill).not.toMatch(/delete\s+from/);
  });
});
