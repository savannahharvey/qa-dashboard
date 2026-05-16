import type { DashboardRepository } from "../db/repository.js";
import { formatMetricKind, formatMetricSource, formatMetricStatus, formatTestCategory } from "../domain/apiFormat.js";
import type { MetricStatus, QaMetric, TestCategory } from "../domain/types.js";

type Diagnostic = { source: "azure-devops"; message: string };
type AzureSettings = {
  organizationEnv?: string;
  projectEnv?: string;
  categoryMap?: Partial<Record<"unit" | "api" | "ui", { runTitleIncludes?: string; buildDefinitionId?: number }>>;
};

const categories: TestCategory[] = ["UNIT", "API", "UI"];
const categoryApiValues = { UNIT: "unit", API: "api", UI: "ui" } as const;

export async function refreshAzureMetrics(repository: DashboardRepository, teamId: string) {
  const refreshedAt = new Date().toISOString();
  const diagnostics: Diagnostic[] = [];
  const config = repository.findMetricSourceConfig(teamId, "AZURE_DEVOPS");

  if (!config || config.enabled !== 1) {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps configuration is not enabled." });
    const metrics = unavailableMetrics(teamId, refreshedAt);
    repository.replaceMetricsBySource(teamId, "AZURE_DEVOPS", metrics);
    return formatRefreshResponse(refreshedAt, metrics, diagnostics);
  }

  const settings = parseSettings(config.settings);
  const organization = getEnv(settings.organizationEnv ?? "AZURE_DEVOPS_ORG");
  const project = getEnv(settings.projectEnv ?? "AZURE_DEVOPS_PROJECT");
  const token = getEnv("AZURE_DEVOPS_PAT");

  if (!organization || !project || !token) {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps organization, project, or token configuration is missing." });
    const metrics = unavailableMetrics(teamId, refreshedAt);
    repository.replaceMetricsBySource(teamId, "AZURE_DEVOPS", metrics);
    return formatRefreshResponse(refreshedAt, metrics, diagnostics);
  }

  try {
    const metrics = await fetchAzureMetrics(teamId, refreshedAt, organization, project, token, settings);
    repository.replaceMetricsBySource(teamId, "AZURE_DEVOPS", metrics);
    return formatRefreshResponse(refreshedAt, metrics, diagnostics);
  } catch {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps metrics could not be refreshed." });
    const metrics = unavailableMetrics(teamId, refreshedAt);
    repository.replaceMetricsBySource(teamId, "AZURE_DEVOPS", metrics);
    return formatRefreshResponse(refreshedAt, metrics, diagnostics);
  }
}

async function fetchAzureMetrics(
  teamId: string,
  refreshedAt: string,
  organization: string,
  project: string,
  token: string,
  settings: AzureSettings,
) {
  const auth = Buffer.from(`:${token}`).toString("base64");
  const baseUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/test`;
  const runsResponse = await fetch(`${baseUrl}/runs?api-version=7.1`, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });

  if (!runsResponse.ok) {
    throw new Error("Azure runs request failed");
  }

  const runsBody = (await runsResponse.json()) as { value?: Array<Record<string, unknown>> };
  const runs = Array.isArray(runsBody.value) ? runsBody.value : [];
  const metrics: QaMetric[] = [];

  for (const category of categories) {
    const run = selectRun(runs, category, settings);
    if (!run) {
      metrics.push(buildMetric(teamId, category, "UNAVAILABLE", null, refreshedAt));
      metrics.push(buildCoverageMetric(teamId, category, null, refreshedAt));
      continue;
    }

    const runId = String(run.id ?? "");
    const resultsResponse = await fetch(`${baseUrl}/runs/${encodeURIComponent(runId)}/results?api-version=7.1`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });

    if (!resultsResponse.ok) {
      metrics.push(buildMetric(teamId, category, "UNAVAILABLE", null, refreshedAt));
      metrics.push(buildCoverageMetric(teamId, category, null, refreshedAt));
      continue;
    }

    const resultsBody = (await resultsResponse.json()) as { value?: Array<{ outcome?: string }> };
    const outcomes = Array.isArray(resultsBody.value) ? resultsBody.value.map((result) => result.outcome) : [];
    metrics.push(buildMetric(teamId, category, mapOutcomes(outcomes), null, refreshedAt));
    metrics.push(buildCoverageMetric(teamId, category, null, refreshedAt));
  }

  return metrics;
}

function selectRun(runs: Array<Record<string, unknown>>, category: TestCategory, settings: AzureSettings) {
  const apiCategory = categoryApiValues[category];
  const mapping = settings.categoryMap?.[apiCategory];
  const titleNeedle = mapping?.runTitleIncludes ?? apiCategory;
  const buildDefinitionId = mapping?.buildDefinitionId;

  return runs.find((run) => {
    const name = String(run.name ?? run.title ?? "").toLowerCase();
    const definitionId = Number((run.buildConfiguration as { id?: number } | undefined)?.id ?? run.buildDefinitionId);
    return name.includes(titleNeedle.toLowerCase()) && (!buildDefinitionId || definitionId === buildDefinitionId);
  });
}

function mapOutcomes(outcomes: Array<string | undefined>): MetricStatus {
  if (outcomes.length === 0) {
    return "UNAVAILABLE";
  }

  const normalized = outcomes.map((outcome) => String(outcome ?? "").toLowerCase());
  if (normalized.every((outcome) => outcome === "passed")) {
    return "PASSING";
  }

  if (normalized.some((outcome) => ["failed", "error", "timeout", "aborted"].includes(outcome))) {
    return "FAILING";
  }

  return "UNAVAILABLE";
}

function unavailableMetrics(teamId: string, timestamp: string) {
  return categories.flatMap((category) => [
    buildMetric(teamId, category, "UNAVAILABLE", null, timestamp),
    buildCoverageMetric(teamId, category, null, timestamp),
  ]);
}

function buildMetric(teamId: string, category: TestCategory, status: MetricStatus, testSuiteId: string | null, timestamp: string): QaMetric {
  return {
    id: `metric-azure-${categoryApiValues[category]}-passing`,
    teamId,
    testSuiteId,
    category,
    kind: "TESTS_PASSING",
    status,
    value: status === "PASSING" ? 1 : status === "FAILING" ? 0 : null,
    unit: "state",
    source: "AZURE_DEVOPS",
    measuredAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildCoverageMetric(teamId: string, category: TestCategory, value: number | null, timestamp: string): QaMetric {
  return {
    id: `metric-azure-${categoryApiValues[category]}-coverage`,
    teamId,
    testSuiteId: null,
    category,
    kind: "TEST_COVERAGE",
    status: value === null ? "UNAVAILABLE" : null,
    value,
    unit: "%",
    source: "AZURE_DEVOPS",
    measuredAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function formatRefreshResponse(refreshedAt: string, metrics: QaMetric[], diagnostics: Diagnostic[]) {
  return {
    source: "azure-devops",
    refreshedAt,
    metrics: metrics.map((metric) => ({
      id: metric.id,
      teamId: metric.teamId,
      category: formatTestCategory(metric.category),
      kind: formatMetricKind(metric.kind),
      status: formatMetricStatus(metric.status),
      value: metric.value,
      unit: metric.unit,
      source: formatMetricSource(metric.source),
      measuredAt: metric.measuredAt,
    })),
    diagnostics,
  };
}

function parseSettings(settings: string): AzureSettings {
  try {
    return JSON.parse(settings) as AzureSettings;
  } catch {
    return {};
  }
}

function getEnv(name: string) {
  return process.env[name]?.trim();
}
