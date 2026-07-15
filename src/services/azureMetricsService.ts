import type { DashboardRepository, MetricSourceConfig } from "../db/repository.js";
import { formatMetricKind, formatMetricSource, formatMetricStatus, formatTestCategory } from "../domain/apiFormat.js";
import type { MetricStatus, QaMetric, TestCategory } from "../domain/types.js";
import { decryptPat } from "./patEncryption.js";

type Diagnostic = { source: "azure-devops"; message: string };
type TestCounts = { passed: number | null; failed: number | null; total: number | null };
type AzureSettings = {
  organizationEnv?: string;
  projectEnv?: string;
  organization?: string;
  project?: string;
  buildDefinitionId?: number;
  tokenEnv?: string;
  categoryMap?: Partial<Record<"unit" | "api" | "ui", { runTitleIncludes?: string; buildDefinitionId?: number }>>;
};

export type AzurePipelineDefinition = {
  id: number;
  name: string;
  path?: string;
};

const categories: TestCategory[] = ["UNIT", "API", "UI"];
const categoryApiValues = { UNIT: "unit", API: "api", UI: "ui" } as const;

export async function refreshAzureMetrics(repository: DashboardRepository, teamId: string) {
  const refreshedAt = new Date().toISOString();
  const diagnostics: Diagnostic[] = [];

  let config: Awaited<ReturnType<DashboardRepository["findMetricSourceConfig"]>>;
  try {
    config = await repository.findMetricSourceConfig(teamId, "AZURE_DEVOPS");
  } catch {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps configuration could not be loaded." });
    return persistAndRespond(repository, teamId, unavailableMetrics(teamId, refreshedAt), refreshedAt, diagnostics);
  }

  if (!config || (config.enabled !== 1 && config.enabled !== true)) {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps configuration is not enabled." });
    return persistAndRespond(repository, teamId, unavailableMetrics(teamId, refreshedAt), refreshedAt, diagnostics);
  }

  const settings = parseSettings(config.settings);
  const organization = settings.organization ?? getEnv(settings.organizationEnv ?? "AZURE_DEVOPS_ORG");
  const project = settings.project ?? getEnv(settings.projectEnv ?? "AZURE_DEVOPS_PROJECT");
  const token = resolveToken(config, settings);

  if (!organization || !project || !token) {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps organization, project, or token configuration is missing." });
    return persistAndRespond(repository, teamId, unavailableMetrics(teamId, refreshedAt), refreshedAt, diagnostics);
  }

  let metrics: QaMetric[];
  try {
    metrics = await fetchAzureMetrics(teamId, refreshedAt, organization, project, token, settings);
  } catch {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps metrics could not be refreshed." });
    metrics = unavailableMetrics(teamId, refreshedAt);
  }

  return persistAndRespond(repository, teamId, metrics, refreshedAt, diagnostics);
}

async function persistAndRespond(
  repository: DashboardRepository,
  teamId: string,
  metrics: QaMetric[],
  refreshedAt: string,
  diagnostics: Diagnostic[],
) {
  try {
    await repository.replaceMetricsBySource(teamId, "AZURE_DEVOPS", metrics);
  } catch (error) {
    console.error("replaceMetricsBySource failed", error);
    diagnostics.push({ source: "azure-devops", message: "Refreshed metrics could not be saved." });
  }

  // Record a daily pass-rate snapshot so the Test Results page can chart history over time.
  const snapshot = aggregateCounts(metrics);
  if (snapshot.total > 0) {
    try {
      await repository.recordMetricSnapshot(teamId, snapshot.passed, snapshot.total);
    } catch (error) {
      console.error("recordMetricSnapshot failed", error);
    }
  }

  return formatRefreshResponse(refreshedAt, metrics, diagnostics);
}

function aggregateCounts(metrics: QaMetric[]) {
  let passed = 0;
  let total = 0;
  for (const metric of metrics) {
    if (metric.kind === "TESTS_PASSING" && typeof metric.totalTests === "number" && metric.totalTests > 0) {
      passed += metric.passedTests ?? 0;
      total += metric.totalTests;
    }
  }
  return { passed, total };
}

export async function listAzurePipelines(repository: DashboardRepository, teamId: string) {
  const diagnostics: Diagnostic[] = [];

  let config: Awaited<ReturnType<DashboardRepository["findMetricSourceConfig"]>>;
  try {
    config = await repository.findMetricSourceConfig(teamId, "AZURE_DEVOPS");
  } catch {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps configuration could not be loaded." });
    return { pipelines: [] as AzurePipelineDefinition[], diagnostics };
  }

  if (!config || (config.enabled !== 1 && config.enabled !== true)) {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps configuration is not enabled." });
    return { pipelines: [] as AzurePipelineDefinition[], diagnostics };
  }

  const settings = parseSettings(config.settings);
  const organization = settings.organization ?? getEnv(settings.organizationEnv ?? "AZURE_DEVOPS_ORG");
  const project = settings.project ?? getEnv(settings.projectEnv ?? "AZURE_DEVOPS_PROJECT");
  const token = resolveToken(config, settings);

  if (!organization || !project || !token) {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps organization, project, or token configuration is missing." });
    return { pipelines: [] as AzurePipelineDefinition[], diagnostics };
  }

  try {
    const pipelines = await fetchAzurePipelineDefinitions(organization, project, token);
    return { pipelines, diagnostics };
  } catch {
    diagnostics.push({ source: "azure-devops", message: "Azure DevOps pipelines could not be loaded." });
    return { pipelines: [] as AzurePipelineDefinition[], diagnostics };
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
    const counts = readRunCounts(run, outcomes);
    metrics.push(buildMetric(teamId, category, mapOutcomes(outcomes), null, refreshedAt, counts));
    metrics.push(buildCoverageMetric(teamId, category, null, refreshedAt));
  }

  return metrics;
}

function selectRun(runs: Array<Record<string, unknown>>, category: TestCategory, settings: AzureSettings) {
  const apiCategory = categoryApiValues[category];
  const mapping = settings.categoryMap?.[apiCategory];
  const titleNeedle = mapping?.runTitleIncludes ?? apiCategory;
  const buildDefinitionId = mapping?.buildDefinitionId ?? settings.buildDefinitionId;

  return runs.find((run) => {
    const name = String(run.name ?? run.title ?? "").toLowerCase();
    const definitionId = Number(
      (run.buildConfiguration as { buildDefinitionId?: number } | undefined)?.buildDefinitionId ?? run.buildDefinitionId,
    );
    // The test/runs list endpoint doesn't include buildConfiguration, so definitionId is often
    // unavailable — only enforce the pipeline filter when we actually have something to compare.
    const matchesPipeline = !buildDefinitionId || !Number.isFinite(definitionId) || definitionId === buildDefinitionId;
    return name.includes(titleNeedle.toLowerCase()) && matchesPipeline;
  });
}

async function fetchAzurePipelineDefinitions(organization: string, project: string, token: string) {
  const auth = Buffer.from(`:${token}`).toString("base64");
  const url = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/build/definitions?api-version=7.1`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Azure pipeline definitions request failed");
  }

  const body = (await response.json()) as { value?: Array<Record<string, unknown>> };
  const definitions = Array.isArray(body.value) ? body.value : [];

  return definitions
    .map((definition) => ({
      id: Number(definition.id),
      name: String(definition.name ?? definition.path ?? `Pipeline ${definition.id}`),
      path: typeof definition.path === "string" ? definition.path : undefined,
    }))
    .filter((definition) => Number.isFinite(definition.id))
    .sort((a, b) => a.name.localeCompare(b.name));
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

function buildMetric(
  teamId: string,
  category: TestCategory,
  status: MetricStatus,
  testSuiteId: string | null,
  timestamp: string,
  counts?: TestCounts,
): QaMetric {
  return {
    id: `metric-azure-${teamId}-${categoryApiValues[category]}-passing`,
    teamId,
    testSuiteId,
    category,
    kind: "TESTS_PASSING",
    status,
    value: status === "PASSING" ? 1 : status === "FAILING" ? 0 : null,
    unit: "state",
    source: "AZURE_DEVOPS",
    measuredAt: timestamp,
    passedTests: counts?.passed ?? null,
    failedTests: counts?.failed ?? null,
    totalTests: counts?.total ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildCoverageMetric(teamId: string, category: TestCategory, value: number | null, timestamp: string): QaMetric {
  return {
    id: `metric-azure-${teamId}-${categoryApiValues[category]}-coverage`,
    teamId,
    testSuiteId: null,
    category,
    kind: "TEST_COVERAGE",
    status: value === null ? "UNAVAILABLE" : null,
    value,
    unit: "%",
    source: "AZURE_DEVOPS",
    measuredAt: timestamp,
    passedTests: null,
    failedTests: null,
    totalTests: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

// The run summary (totalTests/passedTests) is authoritative and always present; the per-result
// outcomes give an exact failed count. Fall back to deriving from the summary when results are absent.
function readRunCounts(run: Record<string, unknown>, outcomes: Array<string | undefined>): TestCounts {
  const normalized = outcomes.map((outcome) => String(outcome ?? "").toLowerCase());
  const failedOutcomes = normalized.filter((outcome) => ["failed", "error", "timeout", "aborted"].includes(outcome)).length;
  const passedOutcomes = normalized.filter((outcome) => outcome === "passed").length;

  const total = toCount(run.totalTests) ?? (outcomes.length > 0 ? outcomes.length : null);
  const passed = toCount(run.passedTests) ?? (outcomes.length > 0 ? passedOutcomes : null);
  const failed =
    outcomes.length > 0 ? failedOutcomes : total !== null && passed !== null ? Math.max(0, total - passed) : null;

  return { passed, failed, total };
}

function toCount(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
      passedTests: metric.passedTests,
      failedTests: metric.failedTests,
      totalTests: metric.totalTests,
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

function resolveToken(config: MetricSourceConfig, settings: AzureSettings): string | undefined {
  if (config.encryptedPat) {
    try {
      return decryptPat(config.encryptedPat);
    } catch {
      // Treat an undecryptable stored PAT (e.g. key mismatch) as if no team PAT were set.
    }
  }

  return getEnv(settings.tokenEnv ?? "AZURE_DEVOPS_PAT");
}
