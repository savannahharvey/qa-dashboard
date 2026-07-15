import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { AnalyticsPanel } from "../components/AnalyticsPanel";
import { HealthScoreRing, scoreColor } from "../components/HealthScoreRing";
import { categoryColors } from "../components/CategoryMetricsRow";
import { getTeamAnalytics, type BalanceSlice, type CicdVelocityWeek, type TeamAnalytics } from "../api";
import { useAuth } from "../state/AuthContext";

function VelocityChart({ weeks }: { weeks: CicdVelocityWeek[] }) {
  const width = 320;
  const height = 132;
  const padding = { top: 8, right: 8, bottom: 18, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...weeks.map((week) => Math.max(week.commits, week.runs)));
  const groupWidth = chartWidth / weeks.length;
  const barWidth = Math.max(2, groupWidth / 2 - 2);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Weekly CI runs versus commits over the last 12 weeks"
    >
      {weeks.map((week, index) => {
        const groupX = padding.left + index * groupWidth;
        const commitsHeight = (week.commits / max) * chartHeight;
        const runsHeight = (week.runs / max) * chartHeight;
        const baseY = padding.top + chartHeight;
        return (
          <g key={week.weekStart}>
            <rect
              x={groupX + groupWidth / 2 - barWidth - 1}
              y={baseY - commitsHeight}
              width={barWidth}
              height={commitsHeight}
              rx={1.5}
              fill="var(--border-strong, #94a3b8)"
            >
              <title>{`Week of ${week.weekStart.slice(0, 10)}: ${week.commits} commits`}</title>
            </rect>
            <rect
              x={groupX + groupWidth / 2 + 1}
              y={baseY - runsHeight}
              width={barWidth}
              height={runsHeight}
              rx={1.5}
              fill="var(--accent, #2563eb)"
            >
              <title>{`Week of ${week.weekStart.slice(0, 10)}: ${week.runs} CI runs`}</title>
            </rect>
          </g>
        );
      })}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        stroke="var(--border-soft)"
        strokeWidth={1}
      />
    </svg>
  );
}

function BalanceDonut({ distribution }: { distribution: BalanceSlice[] }) {
  const size = 132;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Test type distribution">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-soft)" strokeWidth={stroke} />
      {distribution.map((slice) => {
        const length = (slice.percent / 100) * circumference;
        const node = (
          <circle
            key={slice.category}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={categoryColors[slice.category]}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-acc}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        acc += length;
        return node;
      })}
    </svg>
  );
}

const principleStatusLabel = { pass: "Covered", warn: "Thin", missing: "Missing" } as const;

export function InsightsPage() {
  const { primaryTeam } = useAuth();
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!primaryTeam) {
      setAnalytics(null);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getTeamAnalytics(primaryTeam.id)
      .then((data) => {
        if (!cancelled) {
          setAnalytics(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load insights.");
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

  return (
    <AppShell>
      <main className="page">
        <header className="page-header">
          <div>
            <span className="eyebrow">Analytics</span>
            <h1>Insights</h1>
            <p className="muted" style={{ maxWidth: "46rem" }}>
              Signals derived from your connected pipeline — a QA health score, testing-pyramid balance, and quality-principle
              coverage. Panels that need data you haven't connected yet show what's required.
            </p>
          </div>
        </header>

        {loading ? <p className="muted">Loading insights...</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {!primaryTeam ? (
          <section className="empty-state">
            <h3>No team selected</h3>
            <p className="muted">Join a team to view QA insights.</p>
          </section>
        ) : null}

        {primaryTeam && !loading && analytics ? (
          <>
            <section className="health-hero">
              <HealthScoreRing score={analytics.healthScore} />
              <div>
                <span className="eyebrow">QA health score</span>
                <h2 style={{ color: scoreColor(analytics.healthScore) }}>
                  {analytics.healthScore === null ? "Not enough data yet" : `${analytics.healthScore} / 100`}
                </h2>
                <p className="muted">
                  {analytics.healthScore === null
                    ? "Sync Azure DevOps on the Integrations page to generate a score."
                    : "Averaged across the insight panels that have data. Connect more sources to sharpen it."}
                </p>
              </div>
            </section>

            <section className="analytics-grid">
              <AnalyticsPanel
                eyebrow="Testing pyramid"
                title="Test Type Balance"
                score={analytics.testTypeBalance.available ? analytics.testTypeBalance.score : undefined}
                unavailableReason={analytics.testTypeBalance.available ? undefined : analytics.testTypeBalance.reason}
              >
                {analytics.testTypeBalance.available ? (
                  <div className="balance-body">
                    <BalanceDonut distribution={analytics.testTypeBalance.distribution} />
                    <div className="balance-legend">
                      {analytics.testTypeBalance.distribution.map((slice) => (
                        <div className="balance-legend-row" key={slice.category}>
                          <span className="legend-dot" style={{ background: categoryColors[slice.category] }} />
                          <span className="legend-label">{slice.label}</span>
                          <span className="legend-value mono">
                            {slice.percent}% <span className="muted">({slice.count}) · target {slice.targetPercent}%</span>
                          </span>
                        </div>
                      ))}
                      <p className="balance-recommendation">{analytics.testTypeBalance.recommendation}</p>
                    </div>
                  </div>
                ) : null}
              </AnalyticsPanel>

              <AnalyticsPanel
                eyebrow="Coverage quality"
                title="Quality Principles"
                score={analytics.qualityPrinciples.available ? analytics.qualityPrinciples.score : undefined}
                unavailableReason={analytics.qualityPrinciples.available ? undefined : analytics.qualityPrinciples.reason}
              >
                {analytics.qualityPrinciples.available ? (
                  <ul className="principle-list">
                    {analytics.qualityPrinciples.principles.map((principle) => (
                      <li className="principle-row" key={principle.key}>
                        <span className={`principle-status ${principle.status}`}>{principleStatusLabel[principle.status]}</span>
                        <div className="principle-body">
                          <span className="principle-label">{principle.label}</span>
                          {principle.examples.length > 0 ? (
                            <span className="principle-examples muted">e.g. {principle.examples.join(", ")}</span>
                          ) : (
                            <span className="principle-examples muted">No matching tests found</span>
                          )}
                        </div>
                        <span className="principle-count mono">{principle.matched}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </AnalyticsPanel>

              <AnalyticsPanel
                eyebrow="Automation"
                title="CI/CD Velocity"
                score={analytics.ciCdVelocity.available ? analytics.ciCdVelocity.score : undefined}
                unavailableReason={analytics.ciCdVelocity.available ? undefined : analytics.ciCdVelocity.reason}
              >
                {analytics.ciCdVelocity.available ? (
                  <div className="velocity-body">
                    <VelocityChart weeks={analytics.ciCdVelocity.weeks} />
                    <div className="velocity-legend">
                      <span className="velocity-legend-item">
                        <span className="legend-dot" style={{ background: "var(--border-strong, #94a3b8)" }} />
                        Commits ({analytics.ciCdVelocity.totalCommits})
                      </span>
                      <span className="velocity-legend-item">
                        <span className="legend-dot" style={{ background: "var(--accent, #2563eb)" }} />
                        CI runs ({analytics.ciCdVelocity.totalRuns})
                      </span>
                      <span className="velocity-ratio mono">
                        {Math.round(analytics.ciCdVelocity.ratio * 100)}% alignment
                      </span>
                    </div>
                    <p className="balance-recommendation">{analytics.ciCdVelocity.recommendation}</p>
                  </div>
                ) : null}
              </AnalyticsPanel>

              <AnalyticsPanel eyebrow="Product coverage" title="User Flow Coverage" unavailableReason={analytics.userFlowCoverage.reason} />
            </section>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}

export default InsightsPage;
