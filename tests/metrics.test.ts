import { describe, expect, it } from "vitest";
import { calculateGoalProgress, calculateNumericProgress, clampPercent } from "../src/domain/metrics.js";

const baseGoal = {
  id: "goal",
  teamId: "team-qa",
  ownerId: "user-sam",
  scope: "TEAM",
  parentGoalId: null,
  title: "Reach 90% unit test coverage",
  description: null,
  metricType: "TEST_COVERAGE",
  testCategory: "UNIT",
  currentValue: 82,
  targetValue: 90,
  unit: "%",
  dueDate: null,
  status: "ACTIVE",
  createdAt: "2026-05-09T00:00:00.000Z",
  updatedAt: "2026-05-09T00:00:00.000Z",
} as const;

describe("metric progress", () => {
  it("clamps display percentages to the dashboard range", () => {
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(57)).toBe(57);
    expect(clampPercent(140)).toBe(100);
  });

  it("calculates coverage progress against the goal target", () => {
    expect(calculateNumericProgress(82, 90)).toMatchObject({
      available: true,
      currentValue: 82,
      targetValue: 90,
      complete: false,
    });
  });

  it("treats unavailable coverage as unavailable progress", () => {
    expect(calculateNumericProgress(undefined, 90)).toEqual({
      available: false,
      targetValue: 90,
      percent: null,
      complete: false,
    });
  });

  it("uses QA coverage metrics to drive matching goals", () => {
    const metric = {
      id: "metric-unit-coverage",
      teamId: "team-qa",
      testSuiteId: "suite-unit",
      category: "UNIT",
      kind: "TEST_COVERAGE",
      status: null,
      value: 92,
      unit: "%",
      source: "MANUAL",
      measuredAt: null,
      passedTests: null,
      failedTests: null,
      totalTests: null,
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z",
    } as const;

    expect(calculateGoalProgress(baseGoal, metric)).toMatchObject({
      available: true,
      currentValue: 92,
      targetValue: 90,
      complete: true,
    });
  });

  it("maps tests passing to complete and failing to incomplete", () => {
    const goal = {
      ...baseGoal,
      metricType: "TESTS_PASSING",
      testCategory: "API",
      currentValue: 0,
      targetValue: 1,
    } as const;

    const passingMetric = {
      id: "metric-api-passing",
      teamId: "team-qa",
      testSuiteId: "suite-api",
      category: "API",
      kind: "TESTS_PASSING",
      status: "PASSING",
      value: null,
      unit: null,
      source: "MANUAL",
      measuredAt: null,
      passedTests: null,
      failedTests: null,
      totalTests: null,
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z",
    } as const;

    expect(calculateGoalProgress(goal, passingMetric)).toMatchObject({ complete: true, currentValue: 1 });
    expect(calculateGoalProgress(goal, { ...passingMetric, status: "FAILING" })).toMatchObject({
      complete: false,
      currentValue: 0,
    });
  });

  it("uses the pass rate from run counts against a percentage target", () => {
    const goal = {
      ...baseGoal,
      metricType: "TESTS_PASSING",
      testCategory: "UI",
      currentValue: 0,
      targetValue: 100,
    } as const;

    const metric = {
      id: "metric-ui-passing",
      teamId: "team-qa",
      testSuiteId: "suite-ui",
      category: "UI",
      kind: "TESTS_PASSING",
      status: "PASSING",
      value: null,
      unit: null,
      source: "AZURE_DEVOPS",
      measuredAt: null,
      passedTests: 35,
      failedTests: 0,
      totalTests: 35,
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z",
    } as const;

    expect(calculateGoalProgress(goal, metric)).toMatchObject({
      available: true,
      currentValue: 100,
      targetValue: 100,
      percent: 100,
      complete: true,
    });

    expect(calculateGoalProgress(goal, { ...metric, passedTests: 30 })).toMatchObject({
      currentValue: 86,
      percent: 86,
      complete: false,
    });
  });
});
