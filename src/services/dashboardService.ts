import {
  formatGoalScope,
  formatGoalStatus,
  formatMetricKind,
  formatMetricSource,
  formatMetricStatus,
  formatTestCategory,
} from "../domain/apiFormat.js";
import { buildMetricKey, calculateGoalProgress, clampPercent } from "../domain/metrics.js";
import type { GoalWithOwner, QaMetric } from "../domain/types.js";
import type { DashboardRepository } from "../db/repository.js";
import { toBoolean } from "../db/repository.js";

export function getTeamDashboard(repository: DashboardRepository, teamId: string) {
  const team = repository.findTeam(teamId);

  if (!team) {
    return null;
  }

  const testSuites = repository.findTestSuitesByTeam(teamId);
  const qaMetrics = repository.findMetricsByTeam(teamId);
  const goals = repository.findGoalsByTeam(teamId);

  return {
    team: {
      id: team.id,
      name: team.name,
      joinCode: team.joinCode,
    },
    testSuites: testSuites.map((suite) => ({
      id: suite.id,
      category: formatTestCategory(suite.category),
      name: suite.name,
      source: formatMetricSource(suite.source),
      enabled: toBoolean(suite.enabled),
    })),
    metrics: qaMetrics.map(formatQaMetric),
    goals: formatGoalsWithMetrics(goals, qaMetrics),
  };
}

export function getTeamMetrics(repository: DashboardRepository, teamId: string) {
  return repository.findMetricsByTeam(teamId).map(formatQaMetric);
}

export function getTeamGoals(repository: DashboardRepository, teamId: string) {
  const goals = repository.findGoalsByTeam(teamId);
  const metrics = repository.findMetricsByTeam(teamId);
  return formatGoalsWithMetrics(goals, metrics);
}

function formatGoalsWithMetrics(goals: GoalWithOwner[], metrics: QaMetric[]) {
  const metricsByKey = new Map(metrics.map((metric) => [buildMetricKey(metric), metric]));

  return goals.map((goal) => {
    const metric = goal.metricType && goal.testCategory ? metricsByKey.get(`${goal.testCategory}:${goal.metricType}`) : undefined;
    const progress = calculateGoalProgress(goal, metric);

    return {
      id: goal.id,
      teamId: goal.teamId,
      ownerId: goal.ownerId,
      ownerName: goal.ownerDisplayName ?? goal.ownerUsername,
      scope: formatGoalScope(goal.scope),
      parentGoalId: goal.parentGoalId,
      title: goal.title,
      description: goal.description,
      metricType: goal.metricType ? formatMetricKind(goal.metricType) : undefined,
      testCategory: goal.testCategory ? formatTestCategory(goal.testCategory) : undefined,
      currentValue: progress.available ? progress.currentValue : goal.currentValue,
      targetValue: goal.targetValue,
      unit: goal.unit,
      dueDate: goal.dueDate ?? undefined,
      status: progress.complete ? "completed" : formatGoalStatus(goal.status),
      progress,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  });
}

function formatQaMetric(metric: QaMetric) {
  return {
    id: metric.id,
    teamId: metric.teamId,
    testSuiteId: metric.testSuiteId,
    category: formatTestCategory(metric.category),
    kind: formatMetricKind(metric.kind),
    status: formatMetricStatus(metric.status),
    value: metric.value === null || metric.value === undefined ? undefined : clampPercent(metric.value),
    unit: metric.unit,
    source: formatMetricSource(metric.source),
    measuredAt: metric.measuredAt ?? undefined,
  };
}
