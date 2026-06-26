import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { getTeamMetrics } from "../api";
import { categoryLabels, formatMetricValue, metricLabels, statusClass } from "../domain/display";
import { useAuth } from "../state/AuthContext";
import type { QaMetric, TestCategory } from "../types";

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

  const metricsByCategory = useMemo(
    () =>
      (["unit", "api", "ui"] as const).map((category) => ({
        category,
        metrics: metrics.filter((metric) => metric.category === category),
      })),
    [metrics],
  );

  function handlePrint() {
    window.print();
  }

  return (
    <AppShell>
      <main className="page">
        <section className="page-header">
          <div>
            <span className="eyebrow">Metrics</span>
            <h1>Live Azure test results</h1>
            <p className="muted">This page now reflects the team’s connected Azure DevOps pipeline, not seeded mock data.</p>
          </div>
          {primaryTeam && !loading ? (
            <div className="header-actions">
              <button className="button secondary" type="button" onClick={handlePrint}>
                Print / save PDF
              </button>
            </div>
          ) : null}
        </section>

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
            <section className="metrics-grid">
              {metricsByCategory.map(({ category, metrics: categoryMetrics }) => (
                <article className="metric-card" key={category}>
                  <span className="eyebrow">{categoryLabels[category as TestCategory]}</span>
                  <h2>{categoryLabels[category as TestCategory]} tests</h2>
                  {categoryMetrics.length > 0 ? (
                    categoryMetrics.map((metric) => (
                      <div className="metric-row" key={metric.id}>
                        <span>{metricLabels[metric.kind]}</span>
                        <strong className={metric.kind === "tests-passing" ? statusClass(metric.status) : ""}>
                          {formatMetricValue(metric)}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p className="muted">Unavailable</p>
                  )}
                </article>
              ))}
            </section>
          ) : (
            <section className="empty-state">
              <h3>No Azure metrics yet</h3>
              <p className="muted">Save Azure DevOps settings in the dashboard and refresh the pipeline to populate live results.</p>
            </section>
          )
        ) : null}
      </main>
    </AppShell>
  );
}

export default TestResultsPage;
