import { describe, expect, it } from "vitest";
import { questions } from "@assessment/definition";

describe("canonical assessment entry", () => {
  it("renders the real first shared question without creating a parallel mini-assessment", () => {
    expect(questions[0]).toMatchObject({ key: "primary_goal", prompt: "What would you most like STHENO to help you accomplish?", required: true });
    expect(questions[0]?.options).toHaveLength(5);
  });
});
