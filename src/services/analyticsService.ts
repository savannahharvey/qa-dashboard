import type { DashboardRepository, MetricSourceConfig, StoredTestRunResult } from "../db/repository.js";
import { toBoolean } from "../db/repository.js";
import type { QaMetric, TestCategory } from "../domain/types.js";
import { decryptPat } from "./patEncryption.js";
import { fetchGithubVelocity, type VelocityWeek } from "./githubService.js";

type UnavailablePanel = { available: false; reason: string };

type BalanceSlice = { category: "unit" | "api" | "ui"; label: string; count: number; percent: number; targetPercent: number };
type TestTypeBalancePanel =
  | UnavailablePanel
  | { available: true; score: number; totalTests: number; distribution: BalanceSlice[]; recommendation: string };

type PrincipleResult = {
  key: string;
  label: string;
  status: "pass" | "warn" | "missing";
  matched: number;
  examples: string[];
};
type QualityPrinciplesPanel =
  | UnavailablePanel
  | { available: true; score: number; principles: PrincipleResult[]; scannedTests: number };

type CicdVelocityPanel =
  | UnavailablePanel
  | {
      available: true;
      score: number;
      ratio: number;
      totalCommits: number;
      totalRuns: number;
      weeks: VelocityWeek[];
      recommendation: string;
    };

export type TeamAnalytics = {
  generatedAt: string;
  healthScore: number | null;
  testTypeBalance: TestTypeBalancePanel;
  qualityPrinciples: QualityPrinciplesPanel;
  ciCdVelocity: CicdVelocityPanel;
  userFlowCoverage: UnavailablePanel;
};

const balanceLabels: Record<"unit" | "api" | "ui", string> = {
  unit: "Unit",
  api: "Integration (API)",
  ui: "End-to-end (UI)",
};

// Recommended testing-pyramid distribution: mostly unit, fewer integration, fewest end-to-end.
const balanceTargets: Record<"unit" | "api" | "ui", number> = { unit: 70, api: 20, ui: 10 };

const categoryApiValues: Record<TestCategory, "unit" | "api" | "ui"> = { UNIT: "unit", API: "api", UI: "ui" };

const qualityPrincipleLibrary: Array<{ key: string; label: string; keywords: string[] }> = [
  {
    key: "happy-path",
    label: "Happy path",
    keywords: ["success", "successful", "happy", "valid", "renders", "render", "displays", "display", "returns", "loads", "load", "works", "correct"],
  },
  {
    key: "edge-cases",
    label: "Edge cases",
    keywords: ["edge", "boundary", "empty", "null", "undefined", "zero", "max", "min", "limit", "overflow", "large", "duplicate", "special"],
  },
  {
    key: "error-handling",
    label: "Error handling",
    keywords: ["error", "fail", "failure", "invalid", "reject", "throw", "exception", "catch", "404", "500", "not found", "bad request", "unauthorized", "forbidden"],
  },
  {
    key: "security",
    label: "Security",
    keywords: ["security", "auth", "authentication", "authorization", "permission", "unauthorized", "forbidden", "xss", "sql", "injection", "csrf", "token", "sanitize", "escape", "password"],
  },
  {
    key: "performance",
    label: "Performance",
    keywords: ["performance", "perf", "stress", "latency", "throughput", "concurrent", "timeout", "speed", "benchmark", "load test"],
  },
];

export async function getTeamAnalytics(repository: DashboardRepository, teamId: string): Promise<TeamAnalytics> {
  const [metrics, testResults, githubConfig] = await Promise.all([
    repository.findMetricsByTeam(teamId),
    repository.findTestRunResults(teamId),
    repository.findMetricSourceConfig(teamId, "GITHUB"),
  ]);

  const testTypeBalance = computeTestTypeBalance(metrics);
  const qualityPrinciples = computeQualityPrinciples(testResults);
  const ciCdVelocity = await computeCicdVelocity(githubConfig);

  const userFlowCoverage: UnavailablePanel = {
    available: false,
    reason: "Define named user flows to check which product paths your tests cover. User-flow management isn't set up yet.",
  };

  const availableScores = [testTypeBalance, qualityPrinciples, ciCdVelocity]
    .filter((panel): panel is Extract<typeof panel, { available: true }> => panel.available)
    .map((panel) => panel.score);
  const healthScore = availableScores.length
    ? Math.round(availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length)
    : null;

  return {
    generatedAt: new Date().toISOString(),
    healthScore,
    testTypeBalance,
    qualityPrinciples,
    ciCdVelocity,
    userFlowCoverage,
  };
}

function computeTestTypeBalance(metrics: QaMetric[]): TestTypeBalancePanel {
  const counts: Record<"unit" | "api" | "ui", number> = { unit: 0, api: 0, ui: 0 };
  for (const metric of metrics) {
    if (metric.kind === "TESTS_PASSING" && typeof metric.totalTests === "number") {
      counts[categoryApiValues[metric.category]] += metric.totalTests;
    }
  }

  const total = counts.unit + counts.api + counts.ui;
  if (total === 0) {
    return { available: false, reason: "No test counts yet — run a sync on the Integrations page to populate results." };
  }

  const distribution: BalanceSlice[] = (["unit", "api", "ui"] as const).map((category) => ({
    category,
    label: balanceLabels[category],
    count: counts[category],
    percent: Math.round((counts[category] / total) * 100),
    targetPercent: balanceTargets[category],
  }));

  const deviation = distribution.reduce((sum, slice) => sum + Math.abs(slice.percent - slice.targetPercent), 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - deviation / 2)));

  return {
    available: true,
    score,
    totalTests: total,
    distribution,
    recommendation: buildBalanceRecommendation(distribution, score),
  };
}

function buildBalanceRecommendation(distribution: BalanceSlice[], score: number): string {
  if (score >= 80) {
    return "Your test distribution is close to the recommended pyramid — keep it balanced as the suite grows.";
  }

  const over = [...distribution].sort((a, b) => b.percent - b.targetPercent - (a.percent - a.targetPercent))[0];
  const under = [...distribution].sort((a, b) => a.percent - a.targetPercent - (b.percent - b.targetPercent))[0];

  const missing = distribution.filter((slice) => slice.count === 0).map((slice) => slice.label.toLowerCase());
  const missingNote = missing.length ? ` You currently have no ${missing.join(" or ")} tests.` : "";

  return `Your suite is ${over.label.toLowerCase()}-heavy (${over.percent}%, target ${over.targetPercent}%). Invest in more ${under.label.toLowerCase()} tests (${under.percent}%, target ${under.targetPercent}%) to move toward a healthy pyramid.${missingNote}`;
}

function computeQualityPrinciples(testResults: StoredTestRunResult[]): QualityPrinciplesPanel {
  if (testResults.length === 0) {
    return { available: false, reason: "Run a sync so individual test names can be scanned for quality-principle coverage." };
  }

  const names = testResults.map((result) => result.name.toLowerCase());

  const principles: PrincipleResult[] = qualityPrincipleLibrary.map((principle) => {
    const examples: string[] = [];
    let matched = 0;
    testResults.forEach((result, index) => {
      if (principle.keywords.some((keyword) => names[index].includes(keyword))) {
        matched += 1;
        if (examples.length < 2 && !examples.includes(result.name)) {
          examples.push(result.name);
        }
      }
    });

    const status: PrincipleResult["status"] = matched === 0 ? "missing" : matched === 1 ? "warn" : "pass";
    return { key: principle.key, label: principle.label, status, matched, examples };
  });

  const score = Math.round(
    principles.reduce((sum, principle) => sum + (principle.status === "pass" ? 100 : principle.status === "warn" ? 50 : 0), 0) /
      principles.length,
  );

  return { available: true, score, principles, scannedTests: testResults.length };
}

const CICD_NOT_CONNECTED =
  "Connect a GitHub repository on the Integrations page to compare CI runs against commit frequency.";

function parseGithubSettings(settings: string): { repoUrl?: string } {
  try {
    const parsed = JSON.parse(settings) as { repoUrl?: unknown };
    return { repoUrl: typeof parsed.repoUrl === "string" ? parsed.repoUrl : undefined };
  } catch {
    return {};
  }
}

async function computeCicdVelocity(config: MetricSourceConfig | undefined): Promise<CicdVelocityPanel> {
  if (!config || !toBoolean(config.enabled)) {
    return { available: false, reason: CICD_NOT_CONNECTED };
  }

  const { repoUrl } = parseGithubSettings(config.settings);
  if (!repoUrl) {
    return { available: false, reason: CICD_NOT_CONNECTED };
  }

  let token: string | undefined;
  if (config.encryptedPat) {
    try {
      token = decryptPat(config.encryptedPat);
    } catch {
      // An undecryptable stored PAT (e.g. an ENCRYPTION_KEY change) is treated as no token — public repos still work.
    }
  }

  let data: Awaited<ReturnType<typeof fetchGithubVelocity>>;
  try {
    data = await fetchGithubVelocity(repoUrl, token);
  } catch {
    return {
      available: false,
      reason: "Couldn't read commit and CI history from GitHub. Check the connection on the Integrations page.",
    };
  }

  if (data.totalCommits === 0 && data.totalRuns === 0) {
    return { available: false, reason: "No commits or CI runs in the last 12 weeks yet." };
  }

  // Alignment ratio: how many CI runs fired per commit, capped at 1.0. With commits but no runs the ratio is 0
  // (code is landing with no automated verification); with runs but no commits it's a healthy 1.0.
  const ratio = data.totalCommits === 0 ? 1 : Math.min(1, data.totalRuns / data.totalCommits);
  const score = Math.round(ratio * 100);

  return {
    available: true,
    score,
    ratio,
    totalCommits: data.totalCommits,
    totalRuns: data.totalRuns,
    weeks: data.weeks,
    recommendation: buildVelocityRecommendation(ratio, data.totalCommits, data.totalRuns),
  };
}

function buildVelocityRecommendation(ratio: number, totalCommits: number, totalRuns: number): string {
  const summary = `Over the last 12 weeks: ${totalRuns} CI run${totalRuns === 1 ? "" : "s"} against ${totalCommits} commit${
    totalCommits === 1 ? "" : "s"
  }.`;

  if (ratio >= 0.9) {
    return `${summary} Automation is keeping pace — nearly every commit is covered by a CI run.`;
  }
  if (ratio >= 0.6) {
    return `${summary} Most commits trigger CI, but some slip through. Run your pipeline on every push and pull request to close the gap.`;
  }
  if (ratio >= 0.3) {
    return `${summary} CI runs are lagging behind commits — a lot of code is landing without automated verification.`;
  }
  return `${summary} Automation is far behind your code changes. Wire your pipeline to fire on every commit or pull request.`;
}
