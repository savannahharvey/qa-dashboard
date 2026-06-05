import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError, getDashboard, joinTeam, refreshMetrics } from "../api";
import { AppShell } from "../components/AppShell";
import { GoalCard } from "../components/GoalCard";
import { categoryLabels, formatMetricValue, groupGoals, metricLabels, statusClass } from "../domain/display";
import { useAuth } from "../state/AuthContext";
import type { Dashboard } from "../types";

export function DashboardPage() {
  const { primaryTeam, reloadSession } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!primaryTeam) {
      setDashboard(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    getDashboard(primaryTeam.id)
      .then((nextDashboard) => {
        if (!cancelled) setDashboard(nextDashboard);
      })
      .catch(() => {
        if (!cancelled) setError("Dashboard data is unavailable right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [primaryTeam]);

  return (
    <AppShell>
      <main className="dashboard-page">
        {!primaryTeam ? <JoinTeamPanel onJoined={reloadSession} /> : null}
        {primaryTeam ? (
          <>
            <DashboardHeader dashboard={dashboard} onRefresh={() => refreshMetrics(primaryTeam.id)} />
            {loading ? <p className="muted">Loading dashboard...</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            {dashboard ? <TeamBoard dashboard={dashboard} /> : null}
          </>
        ) : null}
      </main>
    </AppShell>
  );
}

function DashboardHeader({ dashboard, onRefresh }: { dashboard: Dashboard | null; onRefresh: () => Promise<unknown> }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMessage("");
    try {
      await onRefresh();
      setRefreshMessage("Metrics refreshed.");
    } catch {
      setRefreshMessage("Metric refresh could not complete.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="page-header">
      <div>
        <span className="eyebrow">Protected dashboard</span>
        <h1>{dashboard?.team.name ?? "Team board"}</h1>
        <p className="muted">Goal progress, owner focus, and QA signals for the current team.</p>
      </div>
      <div className="header-actions">
        {refreshMessage ? <span className="muted">{refreshMessage}</span> : null}
        <button className="button secondary" type="button" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh metrics"}
        </button>
        <Link className="button" to="/dashboard/goals/new">
          Create goal
        </Link>
      </div>
    </section>
  );
}

function TeamBoard({ dashboard }: { dashboard: Dashboard }) {
  const groupedGoals = useMemo(() => groupGoals(dashboard.goals), [dashboard.goals]);
  const metricsByCategory = useMemo(
    () =>
      (["unit", "api", "ui"] as const).map((category) => ({
        category,
        metrics: dashboard.metrics.filter((metric) => metric.category === category),
      })),
    [dashboard.metrics],
  );

  return (
    <>
      <section className="metrics-grid" aria-label="QA metrics">
        {metricsByCategory.map(({ category, metrics }) => (
          <article className="metric-card" key={category}>
            <span className="eyebrow">{categoryLabels[category]}</span>
            <h2>{categoryLabels[category]} tests</h2>
            {metrics.length > 0 ? (
              metrics.map((metric) => (
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

      <section className="board-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">Goals</span>
            <h2>Team goals</h2>
          </div>
          <span className="muted">{dashboard.goals.length} total</span>
        </div>

        {groupedGoals.teamGoals.length === 0 && groupedGoals.unlinkedIndividualGoals.length === 0 ? (
          <div className="empty-state">
            <h3>No goals yet</h3>
            <p className="muted">Create a team goal to start tracking visible progress.</p>
            <Link className="button" to="/dashboard/goals/new">
              Create goal
            </Link>
          </div>
        ) : null}

        <div className="goal-list">
          {groupedGoals.teamGoals.map((goal) => (
            <div className="goal-family" key={goal.id}>
              <GoalCard goal={goal} />
              {(groupedGoals.individualGoalsByParent.get(goal.id) ?? []).map((childGoal) => (
                <GoalCard goal={childGoal} compact key={childGoal.id} />
              ))}
            </div>
          ))}
          {groupedGoals.unlinkedIndividualGoals.map((goal) => (
            <GoalCard goal={goal} compact key={goal.id} />
          ))}
        </div>
      </section>
    </>
  );
}

function JoinTeamPanel({ onJoined }: { onJoined: () => Promise<void> }) {
  const [joinCode, setJoinCode] = useState("QA-232");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await joinTeam(joinCode);
      await onJoined();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not join team.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="join-panel">
      <span className="eyebrow">Team access</span>
      <h1>Join a team</h1>
      <p className="muted">Enter your class team code to open the dashboard.</p>
      <form className="inline-form" onSubmit={handleSubmit}>
        <label>
          Join code
          <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} />
        </label>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Joining..." : "Join team"}
        </button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
