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

export async function getTeamDashboard(repository: DashboardRepository, teamId: string) {
  const team = await repository.findTeam(teamId);

  if (!team) {
    return null;
  }

  const azureOnly = await isAzureOnlyTeam(repository, teamId);
  const [testSuites, qaMetrics, goals] = await Promise.all([
    repository.findTestSuitesByTeam(teamId),
    repository.findMetricsByTeam(teamId),
    repository.findGoalsByTeam(teamId),
  ]);
  const filteredMetrics = filterMetricsForMode(qaMetrics, azureOnly);
  const filteredSuites = azureOnly ? [] : testSuites;

  return {
    team: {
      id: team.id,
      name: team.name,
      joinCode: team.joinCode,
    },
    testSuites: filteredSuites.map((suite) => ({
      id: suite.id,
      category: formatTestCategory(suite.category),
      name: suite.name,
      source: formatMetricSource(suite.source),
      enabled: toBoolean(suite.enabled),
    })),
    metrics: filteredMetrics.map(formatQaMetric),
    goals: formatGoalsWithMetrics(goals, filteredMetrics),
  };
}

export async function getTeamMetrics(repository: DashboardRepository, teamId: string) {
  const azureOnly = await isAzureOnlyTeam(repository, teamId);
  return filterMetricsForMode(await repository.findMetricsByTeam(teamId), azureOnly).map(formatQaMetric);
}

export async function getTeamGoals(repository: DashboardRepository, teamId: string) {
  const azureOnly = await isAzureOnlyTeam(repository, teamId);
  const [goals, metrics] = await Promise.all([repository.findGoalsByTeam(teamId), repository.findMetricsByTeam(teamId)]);
  return formatGoalsWithMetrics(goals, filterMetricsForMode(metrics, azureOnly));
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

async function isAzureOnlyTeam(repository: DashboardRepository, teamId: string) {
  const config = await repository.findMetricSourceConfig(teamId, "AZURE_DEVOPS");
  return Boolean(config && (config.enabled === 1 || config.enabled === true));
}

function filterMetricsForMode(metrics: QaMetric[], azureOnly: boolean) {
  if (!azureOnly) {
    return metrics;
  }

  return metrics.filter((metric) => metric.source === "AZURE_DEVOPS");
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
    passedTests: metric.passedTests ?? undefined,
    failedTests: metric.failedTests ?? undefined,
    totalTests: metric.totalTests ?? undefined,
  };
}
