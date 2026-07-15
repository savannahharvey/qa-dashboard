import type { GoalScope, GoalStatus, MetricKind, MetricSource, MetricStatus, TestCategory } from "./types.js";

const testCategoryMap: Record<TestCategory, string> = {
  UNIT: "unit",
  API: "api",
  UI: "ui",
};

const metricKindMap: Record<MetricKind, string> = {
  TESTS_PASSING: "tests-passing",
  TEST_COVERAGE: "test-coverage",
};

const metricStatusMap: Record<MetricStatus, string> = {
  PASSING: "passing",
  FAILING: "failing",
  UNAVAILABLE: "unavailable",
};

const metricSourceMap: Record<MetricSource, string> = {
  MANUAL: "manual",
  AZURE_DEVOPS: "azure-devops",
  GITHUB: "github",
};

const goalScopeMap: Record<GoalScope, string> = {
  TEAM: "team",
  INDIVIDUAL: "individual",
};

const goalStatusMap: Record<GoalStatus, string> = {
  ACTIVE: "active",
  COMPLETED: "completed",
  AT_RISK: "at-risk",
};

export function formatTestCategory(value: TestCategory) {
  return testCategoryMap[value];
}

export function formatMetricKind(value: MetricKind) {
  return metricKindMap[value];
}

export function formatMetricStatus(value: MetricStatus | null) {
  return value ? metricStatusMap[value] : undefined;
}

export function formatMetricSource(value: MetricSource) {
  return metricSourceMap[value];
}

export function formatGoalScope(value: GoalScope) {
  return goalScopeMap[value];
}

export function formatGoalStatus(value: GoalStatus) {
  return goalStatusMap[value];
}
