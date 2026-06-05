import type { Goal, GoalStatus, MetricKind, MetricStatus, QaMetric, TestCategory } from "../types";

export const categoryLabels: Record<TestCategory, string> = {
  unit: "Unit",
  api: "API",
  ui: "UI",
};

export const metricLabels: Record<MetricKind, string> = {
  "tests-passing": "Tests passing",
  "test-coverage": "Test coverage",
};

export const statusLabels: Record<GoalStatus | MetricStatus, string> = {
  active: "Active",
  completed: "Completed",
  "at-risk": "At risk",
  passing: "Passing",
  failing: "Failing",
  unavailable: "Unavailable",
};

export function statusClass(status?: GoalStatus | MetricStatus | null) {
  return `status ${status ?? "unavailable"}`;
}

export function formatMetricValue(metric: QaMetric) {
  if (metric.kind === "tests-passing") {
    return statusLabels[metric.status ?? "unavailable"];
  }

  if (typeof metric.value === "number") {
    return `${metric.value}${metric.unit ?? ""}`;
  }

  return "Unavailable";
}

export function progressPercent(goal: Goal) {
  if (goal.progress?.available && typeof goal.progress.percentage === "number") {
    return Math.max(0, Math.min(100, Math.round(goal.progress.percentage)));
  }

  if (goal.targetValue === 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)));
}

export function groupGoals(goals: Goal[]) {
  const teamGoals = goals.filter((goal) => goal.scope === "team");
  const individualGoals = goals.filter((goal) => goal.scope === "individual");

  return {
    teamGoals,
    individualGoalsByParent: new Map(
      teamGoals.map((goal) => [goal.id, individualGoals.filter((individual) => individual.parentGoalId === goal.id)]),
    ),
    unlinkedIndividualGoals: individualGoals.filter((goal) => !goal.parentGoalId),
  };
}
