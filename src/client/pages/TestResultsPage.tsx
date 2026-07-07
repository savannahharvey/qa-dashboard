import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { getTeamMetrics } from "../api";
import { CategoryMetricsRow, categoryColors, type CategoryCardData } from "../components/CategoryMetricsRow";
import { LineChart } from "../components/charts/LineChart";
import { categoryLabels } from "../domain/display";
import { sampleCategorySparklines, sampleCoverageTrend, sampleCoverageTrendLabels, sampleReliability } from "../domain/sampleInsights";
import { useAuth } from "../state/AuthContext";
import type { QaMetric } from "../types";

const periodOptions = [
  { label: "Last 8 weeks", weeks: 8 },
  { label: "Last 4 weeks", weeks: 4 },
  { label: "Last quarter", weeks: 13 },
];

function exportMetricsCsv(metrics: QaMetric[]) {
  const header = "category,kind,status,value,unit,source\n";
  const rows = metrics
    .map((metric) => [metric.category, metric.kind, metric.status ?? "", metric.value ?? "", metric.unit ?? "", metric.source].join(","))
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "qa-test-results.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function TestResultsPage() {
  const { primaryTeam } = useAuth();
  const [metrics, setMetrics] = useState<QaMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [periodWeeks, setPeriodWeeks] = useState(8);

  useEffect(() => {
    if (!primaryTeam) {
      setMetrics([]);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getTeamMetrics(primaryTeam.id)
      .then((response) => {
        if (!cancelled) {
          setMetrics(response.metrics ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load Azure test results.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [primaryTeam]);

  const categoryCards: CategoryCardData[] = useMemo(
    () =>
      (["unit", "api", "ui"] as const).map((category) => ({
        category,
        metrics: metrics.filter((metric) => metric.category === category),
        sparkline: sampleCategorySparklines[category],
      })),
    [metrics],
  );

  const latestCoverageByCategory = useMemo(() => {
    const byCategory: Partial<Record<"unit" | "api" | "ui", number>> = {};
    (["unit", "api", "ui"] as const).forEach((category) => {
      const coverageMetric = metrics.find((metric) => metric.category === category && metric.kind === "test-coverage");
      if (typeof coverageMetric?.value === "number") {
        byCategory[category] = coverageMetric.value;
      }
    });
    return byCategory;
  }, [metrics]);

  const trimmedSeries = useMemo(() => {
    const points = Math.min(periodWeeks, sampleCoverageTrend.unit.length);
    return {
      unit: sampleCoverageTrend.unit.slice(-points),
      api: sampleCoverageTrend.api.slice(-points),
      ui: sampleCoverageTrend.ui.slice(-points),
    };
  }, [periodWeeks]);

  function handlePrint() {
    window.print();
  }

  return (
    <AppShell>
      <main className="page">
        <header className="page-header">
          <div>
            <span className="eyebrow">Metrics · Azure DevOps</span>
            <h1>Test results over time</h1>
            <p className="muted">Live coverage and pass-rate history from the connected pipeline.</p>
          </div>
          {primaryTeam && !loading ? (
            <div className="header-actions">
              <select value={periodWeeks} onChange={(event) => setPeriodWeeks(Number(event.target.value))}>
                {periodOptions.map((option) => (
                  <option key={option.label} value={option.weeks}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button className="button secondary" type="button" onClick={() => exportMetricsCsv(metrics)} disabled={metrics.length === 0}>
                Export CSV
              </button>
              <button className="button" type="button" onClick={handlePrint}>
                Print / PDF
              </button>
            </div>
          ) : null}
        </header>

        {loading ? <p className="muted">Loading Azure metrics...</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {!primaryTeam ? (
          <section className="empty-state">
            <h3>No team selected</h3>
            <p className="muted">Join a team to view Azure-backed test results.</p>
          </section>
        ) : null}

        {primaryTeam && !loading ? (
          metrics.length > 0 ? (
            <>
              <article className="chart-card">
                <div className="chart-card-header">
                  <div>
                    <span className="eyebrow">Coverage by category</span>
                    <h2>All suites · last {periodWeeks} weeks</h2>
                  </div>
                  <div className="chart-legend">
                    {(["unit", "api", "ui"] as const).map((category) => (
                      <span key={category}>
                        <span className="chart-swatch" style={{ background: categoryColors[category] }} />
                        {categoryLabels[category]}
                        {typeof latestCoverageByCategory[category] === "number" ? ` ${latestCoverageByCategory[category]}%` : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="sample-tag">SAMPLE SOURCE</span>
                <LineChart
                  width={960}
                  height={300}
                  min={40}
                  max={100}
                  yTicks={[100, 80, 60, 40]}
                  xLabels={sampleCoverageTrendLabels}
                  series={[
                    { label: "Unit", color: categoryColors.unit, values: trimmedSeries.unit },
                    { label: "API", color: categoryColors.api, values: trimmedSeries.api },
                    { label: "UI", color: categoryColors.ui, values: trimmedSeries.ui },
                  ]}
                />
              </article>

              <article className="chart-card">
                <div className="chart-card-header">
                  <div>
                    <span className="eyebrow">Reliability</span>
                    <h2>Failing most often</h2>
                  </div>
                  <span className="muted" style={{ maxWidth: "22rem", fontSize: "0.85rem" }}>
                    Ranked by fail rate across the last 10 runs. <span className="mono">Flaky</span> = passes and fails
                    without code changes.
                  </span>
                </div>
                <span className="sample-tag">SAMPLE SOURCE</span>
                <div className="reliability-table">
                  <span className="reliability-table-head">Test</span>
                  <span className="reliability-table-head">Last 10 runs</span>
                  <span className="reliability-table-head align-right">Fail rate</span>
                  <span className="reliability-table-head align-right">Last failed</span>
                  {sampleReliability.map((test) => (
                    <div className="reliability-row-contents" style={{ display: "contents" }} key={test.name}>
                      <div className="reliability-row-divider" />
                      <div>
                        <div className="reliability-test-name">
                          <span className="mono">{test.name}</span>
                          {test.flaky ? <span className="flaky-badge">FLAKY</span> : null}
                        </div>
                        <span className="reliability-suite">{test.suite}</span>
                      </div>
                      <div className="run-history">
                        {test.runHistory.map((passed, index) => (
                          <span className={`run-square ${passed ? "pass" : "fail"}`} key={index} />
                        ))}
                      </div>
                      <span className="fail-rate">{test.failRatePercent}%</span>
                      <span className="last-failed">{test.lastFailed}</span>
                    </div>
                  ))}
                </div>
              </article>

              <CategoryMetricsRow cards={categoryCards} />
            </>
          ) : (
            <section className="empty-state">
              <h3>No Azure metrics yet</h3>
              <p className="muted">Save Azure DevOps settings on the Integrations page and refresh to populate live results.</p>
            </section>
          )
        ) : null}
      </main>
    </AppShell>
  );
}

export default TestResultsPage;
