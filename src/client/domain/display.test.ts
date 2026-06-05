import { describe, expect, it } from "vitest";
import { formatMetricValue, groupGoals, progressPercent } from "./display";
import type { Goal, QaMetric } from "../types";

describe("dashboard display helpers", () => {
  it("formats metric status and coverage values", () => {
    expect(formatMetricValue(metric({ kind: "tests-passing", status: "passing" }))).toBe("Passing");
    expect(formatMetricValue(metric({ kind: "test-coverage", value: 74, unit: "%" }))).toBe("74%");
    expect(formatMetricValue(metric({ kind: "test-coverage", value: undefined }))).toBe("Unavailable");
  });

  it("caps progress at 100 and avoids division by zero", () => {
    expect(progressPercent(goal({ currentValue: 120, targetValue: 100 }))).toBe(100);
    expect(progressPercent(goal({ currentValue: 3, targetValue: 0 }))).toBe(0);
  });

  it("groups individual goals under their parent team goal", () => {
    const parent = goal({ id: "goal-team", scope: "team" });
    const child = goal({ id: "goal-child", scope: "individual", parentGoalId: "goal-team" });
    const grouped = groupGoals([parent, child]);

    expect(grouped.teamGoals).toEqual([parent]);
    expect(grouped.individualGoalsByParent.get("goal-team")).toEqual([child]);
  });
});

function metric(overrides: Partial<QaMetric>): QaMetric {
  return {
    id: "metric-1",
    teamId: "team-qa",
    category: "api",
    kind: "tests-passing",
    status: "unavailable",
    source: "sample",
    ...overrides,
  };
}

function goal(overrides: Partial<Goal>): Goal {
  return {
    id: "goal-1",
    teamId: "team-qa",
    ownerId: "user-1",
    ownerName: "Sam",
    scope: "team",
    title: "Raise coverage",
    description: null,
    metricType: "test-coverage",
    testCategory: "unit",
    currentValue: 50,
    targetValue: 100,
    unit: "%",
    status: "active",
    ...overrides,
  };
}
