import type { Goal, QaMetric } from "./types.js";

export type MetricProgress =
  | {
      available: true;
      currentValue: number;
      targetValue: number;
      percent: number;
      complete: boolean;
    }
  | {
      available: false;
      targetValue: number;
      percent: null;
      complete: false;
    };

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function calculateNumericProgress(currentValue: number | null | undefined, targetValue: number): MetricProgress {
  if (currentValue === null || currentValue === undefined || !Number.isFinite(currentValue)) {
    return {
      available: false,
      targetValue,
      percent: null,
      complete: false,
    };
  }

  const percent = targetValue > 0 ? clampPercent((currentValue / targetValue) * 100) : 100;

  return {
    available: true,
    currentValue,
    targetValue,
    percent,
    complete: targetValue <= 0 || currentValue >= targetValue,
  };
}

export function calculateGoalProgress(goal: Goal, metric?: QaMetric): MetricProgress {
  if (!metric || goal.metricType !== metric.kind || goal.testCategory !== metric.category) {
    return calculateNumericProgress(goal.currentValue, goal.targetValue);
  }

  if (metric.kind === "TESTS_PASSING") {
    if (metric.status === "PASSING") {
      return calculateNumericProgress(1, goal.targetValue);
    }

    if (metric.status === "FAILING") {
      return calculateNumericProgress(0, goal.targetValue);
    }

    return calculateNumericProgress(undefined, goal.targetValue);
  }

  return calculateNumericProgress(metric.value, goal.targetValue);
}

export function buildMetricKey(metric: Pick<QaMetric, "category" | "kind">) {
  return `${metric.category}:${metric.kind}`;
}
