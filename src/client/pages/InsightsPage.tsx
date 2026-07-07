import { AppShell } from "../components/AppShell";
import { Donut } from "../components/charts/Donut";
import {
  qualityColumns,
  sampleCiCdReadiness,
  sampleQualityMatrix,
  sampleTestPyramid,
  sampleUserFlows,
} from "../domain/sampleInsights";

const factorColor: Record<string, string> = { ok: "#1a8a7a", warn: "#c69a43", gap: "#b1482f" };
const flowIcon: Record<string, string> = { covered: "✓", partial: "~", none: "✕" };

export function InsightsPage() {
  return (
    <AppShell>
      <main className="page">
        <header>
          <span className="eyebrow">Analytics</span>
          <h1>Insights</h1>
          <p className="muted" style={{ maxWidth: "46rem" }}>
            Signals derived from your connected pipeline and repository — how close automation is to your codebase,
            whether the test mix is healthy, and where quality gaps hide. These signals are illustrative sample data
            until a connected pipeline and repository can back them for real.
          </p>
        </header>

        <section className="insights-grid">
          <article className="insight-card">
            <div>
              <span className="eyebrow">CI/CD readiness</span>
              <h2>Automation vs. your codebase</h2>
            </div>
            <div className="readiness-row">
              <Donut score={sampleCiCdReadiness.score} caption="/ 100 · getting there" />
              <div className="factor-list">
                {sampleCiCdReadiness.factors.map((factor) => (
                  <div className="factor-row" key={factor.label}>
                    <div className="factor-label-row">
                      <span>{factor.label}</span>
                      <span className="mono">{factor.val}</span>
                    </div>
                    <div className="factor-track">
                      <span style={{ width: `${factor.pct}%`, background: factorColor[factor.tone] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="insight-note">{sampleCiCdReadiness.note}</p>
          </article>

          <article className="insight-card">
            <div>
              <span className="eyebrow">Test pyramid</span>
              <h2>Unit / Integration / E2E balance</h2>
            </div>
            <div className="pyramid">
              {sampleTestPyramid.tiers.map((tier) => (
                <div className="pyramid-row" key={tier.tier}>
                  <div className="pyramid-bar" style={{ width: tier.widthPercent + "%", minWidth: "8rem", background: tier.color }}>
                    <span>{tier.tier}</span>
                    <span className="mono">
                      {tier.count} · {tier.sharePercent}%
                    </span>
                  </div>
                  <span className="pyramid-ideal">{tier.ideal}</span>
                </div>
              ))}
            </div>
            <p className="insight-note">{sampleTestPyramid.note}</p>
          </article>
        </section>

        <article className="insight-card">
          <div className="chart-card-header">
            <div>
              <span className="eyebrow">User flows</span>
              <h2>Flow coverage</h2>
              <p className="muted" style={{ marginTop: "0.4rem", maxWidth: "40rem" }}>
                Define the journeys that matter. Titles and assertions are scanned to detect which flows your tests
                actually exercise.
              </p>
            </div>
          </div>
          <div className="flow-list">
            {sampleUserFlows.map((flow) => (
              <div className="flow-row" key={flow.name}>
                <span className={`icon-chip ${flow.status}`}>{flowIcon[flow.status]}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="flow-name">{flow.name}</div>
                  <div className="flow-note">{flow.note}</div>
                </div>
                <span className="flow-tests">
                  {flow.tests} {flow.tests === 1 ? "test" : "tests"}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="insight-card">
          <div className="chart-card-header">
            <div>
              <span className="eyebrow">Test quality</span>
              <h2>Principles by feature</h2>
              <p className="muted" style={{ marginTop: "0.4rem", maxWidth: "42rem" }}>
                Whether each feature carries the tests good coverage implies — not just a happy path, but edge cases,
                error handling, security, and accessibility.
              </p>
            </div>
            <div className="quality-matrix-legend">
              <span>
                <span className="icon-chip small covered">✓</span>Covered
              </span>
              <span>
                <span className="icon-chip small partial">~</span>Partial
              </span>
              <span>
                <span className="icon-chip small none">✕</span>Gap
              </span>
            </div>
          </div>
          <div className="quality-matrix">
            <div className="quality-matrix-inner">
              <div className="quality-matrix-row head">
                <span className="mono" style={{ fontSize: "0.64rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#a4b0ab" }}>
                  Feature
                </span>
                {qualityColumns.map((col) => (
                  <span className="quality-matrix-col-label" key={col}>
                    {col}
                  </span>
                ))}
              </div>
              {sampleQualityMatrix.rows.map((row) => (
                <div className="quality-matrix-row" key={row.feature}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{row.feature}</span>
                  {row.cells.map((cell, index) => {
                    const cellClass = cell === "good" ? "covered" : cell === "warn" ? "partial" : "none";
                    const symbol = cell === "good" ? "✓" : cell === "warn" ? "~" : "✕";
                    return (
                      <div className="quality-matrix-cell" key={qualityColumns[index]}>
                        <span className={`icon-chip small ${cellClass}`}>{symbol}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="insight-note">{sampleQualityMatrix.note}</p>
        </article>
      </main>
    </AppShell>
  );
}

export default InsightsPage;
