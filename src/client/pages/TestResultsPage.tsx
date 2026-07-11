import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { getTeamMetrics } from "../api";
import { CategoryMetricsRow, type CategoryCardData } from "../components/CategoryMetricsRow";
import { useAuth } from "../state/AuthContext";
import type { QaMetric } from "../types";

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
        sparkline: [],
      })),
    [metrics],
  );

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
            <CategoryMetricsRow cards={categoryCards} />
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
