import type { DashboardRepository, StoredTestRunResult } from "../db/repository.js";
import type { QaMetric, TestCategory } from "../domain/types.js";

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

export type TeamAnalytics = {
  generatedAt: string;
  healthScore: number | null;
  testTypeBalance: TestTypeBalancePanel;
  qualityPrinciples: QualityPrinciplesPanel;
  ciCdVelocity: UnavailablePanel;
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
  const [metrics, testResults] = await Promise.all([
    repository.findMetricsByTeam(teamId),
    repository.findTestRunResults(teamId),
  ]);

  const testTypeBalance = computeTestTypeBalance(metrics);
  const qualityPrinciples = computeQualityPrinciples(testResults);

  const ciCdVelocity: UnavailablePanel = {
    available: false,
    reason: "Connect a GitHub repository on the Integrations page to compare pipeline runs against commit frequency.",
  };
  const userFlowCoverage: UnavailablePanel = {
    available: false,
    reason: "Define named user flows to check which product paths your tests cover. User-flow management isn't set up yet.",
  };

  const availableScores = [testTypeBalance, qualityPrinciples]
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
