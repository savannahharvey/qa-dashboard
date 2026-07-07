// SAMPLE DATA — not backed by any API. The current backend has no per-category
// historical trend, no per-test-run/flaky tracking, and no CI/CD-readiness, test
// pyramid, or user-flow-coverage signals. This mirrors the "SAMPLE SOURCE"
// convention used in the original design mockup for exactly this situation:
// everything in this file is illustrative, not live data.
import type { TestCategory } from "../types";

export const sampleCoverageTrend: Record<TestCategory, number[]> = {
  unit: [71, 73, 74, 76, 78, 79, 81, 82],
  api: [66, 68, 69, 70, 71, 72, 73, 74],
  ui: [52, 54, 55, 57, 58, 59, 60, 61],
};

export const sampleCoverageTrendLabels: [string, string] = ["May 6", "Jun 24"];

export const sampleCategorySparklines: Record<TestCategory, number[]> = {
  unit: sampleCoverageTrend.unit,
  api: sampleCoverageTrend.api,
  ui: sampleCoverageTrend.ui,
};

export const sampleLandingStats = {
  passRate: 96,
  avgCoverage: 72,
  atRisk: 2,
  trend: [89, 91, 90, 92, 93, 94, 95, 96],
};

export type CiCdFactor = { label: string; val: string; pct: number; tone: "ok" | "warn" | "gap" };

export const sampleCiCdReadiness: { score: number; factors: CiCdFactor[]; note: string } = {
  score: 68,
  factors: [
    { label: "Automated coverage of code surface", val: "72%", pct: 72, tone: "ok" },
    { label: "PRs gated by passing checks", val: "84%", pct: 84, tone: "ok" },
    { label: "Pipeline stages automated", val: "3 / 5", pct: 60, tone: "warn" },
    { label: "Tests block a deploy within", val: "6 min", pct: 80, tone: "ok" },
    { label: "Manual regression still required", val: "Yes", pct: 35, tone: "gap" },
  ],
  note: "Most code paths are covered and PRs are gated, but a required manual regression pass and two non-automated pipeline stages keep you short of continuous delivery. Automate release smoke checks to cross 80.",
};

export type PyramidTier = { tier: string; count: number; sharePercent: number; widthPercent: number; ideal: string; color: string };

export const sampleTestPyramid: { tiers: PyramidTier[]; note: string } = {
  tiers: [
    { tier: "E2E", count: 105, sharePercent: 14, widthPercent: 26, ideal: "target 10%", color: "#b1482f" },
    { tier: "Integration", count: 190, sharePercent: 24, widthPercent: 48, ideal: "target 20%", color: "#c69a43" },
    { tier: "Unit", count: 480, sharePercent: 62, widthPercent: 100, ideal: "target 70%", color: "#0e5a62" },
  ],
  note: "Slightly top-heavy. E2E is 4pts above target and unit is 8pts below. Push a few browser-level assertions down into faster unit or integration tests.",
};

export type FlowStatus = "covered" | "partial" | "none";
export type UserFlow = { name: string; status: FlowStatus; note: string; tests: number };

export const sampleUserFlows: UserFlow[] = [
  { name: "Sign up → Join team → Dashboard", status: "covered", note: "All steps exercised end-to-end.", tests: 5 },
  { name: "Create a goal", status: "partial", note: "Happy path only — validation edge cases not detected.", tests: 2 },
  { name: "Refresh Azure metrics", status: "covered", note: "Config, refresh, and render all covered.", tests: 3 },
  { name: "Switch team", status: "none", note: "No tests detected for this flow.", tests: 0 },
  { name: "Sign out", status: "covered", note: "Session clear verified.", tests: 1 },
];

export type QualityCell = "good" | "warn" | "gap";
export type QualityRow = { feature: string; cells: QualityCell[] };

export const qualityColumns = ["Happy path", "Edge cases", "Errors", "Security", "A11y"];

export const sampleQualityMatrix: { rows: QualityRow[]; note: string } = {
  rows: [
    { feature: "Authentication", cells: ["good", "warn", "good", "warn", "gap"] },
    { feature: "Goals", cells: ["good", "warn", "good", "gap", "gap"] },
    { feature: "Metrics", cells: ["good", "good", "warn", "gap", "gap"] },
    { feature: "Teams", cells: ["good", "gap", "warn", "gap", "gap"] },
  ],
  note: "Biggest gaps: security testing exists only for Authentication, and accessibility is unchecked everywhere. Teams also lacks edge-case coverage.",
};

export type ReliabilityTest = {
  name: string;
  suite: string;
  runHistory: boolean[];
  failRatePercent: number;
  lastFailed: string;
  flaky: boolean;
};

export const sampleReliability: ReliabilityTest[] = [
  {
    name: "renders dashboard metric summary",
    suite: "UI · Playwright",
    runHistory: [true, false, true, false, false, true, false, true, false, false],
    failRatePercent: 34,
    lastFailed: "2h ago",
    flaky: true,
  },
  {
    name: "joinTeam rejects expired code",
    suite: "API · contract",
    runHistory: [true, true, false, true, true, false, true, false, true, true],
    failRatePercent: 21,
    lastFailed: "1d ago",
    flaky: true,
  },
  {
    name: "progressPercent handles zero target",
    suite: "Unit",
    runHistory: [true, true, true, false, true, true, true, true, false, true],
    failRatePercent: 12,
    lastFailed: "3d ago",
    flaky: false,
  },
  {
    name: "AuthContext refreshes on 401",
    suite: "Unit",
    runHistory: [true, true, true, true, true, false, true, true, true, true],
    failRatePercent: 9,
    lastFailed: "5d ago",
    flaky: false,
  },
  {
    name: "create goal validates target > current",
    suite: "API",
    runHistory: [true, true, true, true, true, true, true, false, true, true],
    failRatePercent: 6,
    lastFailed: "6d ago",
    flaky: false,
  },
];
