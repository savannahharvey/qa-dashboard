import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, createTeam, getDashboard, getTestsOverTime, joinTeam, refreshMetrics, type TestsOverTimeRow } from "../api";
import { AppShell } from "../components/AppShell";
import { GoalCard } from "../components/GoalCard";
import { CategoryMetricsRow, type CategoryCardData } from "../components/CategoryMetricsRow";
import { AreaChart } from "../components/charts/AreaChart";
import { Sparkline } from "../components/charts/Sparkline";
import { deriveKpis, groupGoals } from "../domain/display";
import { useAuth } from "../state/AuthContext";
import type { Dashboard } from "../types";

export function DashboardPage({ mode = "dashboard" }: { mode?: "dashboard" | "setup" }) {
  const { primaryTeam, reloadSession } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!primaryTeam) {
      setDashboard(null);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    getDashboard(primaryTeam.id)
      .then((nextDashboard) => {
        if (!cancelled) setDashboard(nextDashboard);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDashboard(null);
        if (err instanceof ApiError) {
          if (err.status === 401) {
            setError("Your session expired. Please sign in again.");
            void reloadSession();
            return;
          }
          if (err.status === 403) {
            setError("You do not have access to this team's dashboard.");
            return;
          }
          if (err.status === 404) {
            setError("That team could not be found.");
            return;
          }
        }
        setError("Dashboard data is unavailable right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [primaryTeam, refreshToken, reloadSession]);

  async function handleRefreshDashboard() {
    if (!primaryTeam) return;
    await refreshMetrics(primaryTeam.id);
    setRefreshToken((value) => value + 1);
  }

  const shouldShowSetup = mode === "setup" || !primaryTeam;

  return (
    <AppShell>
      <main className="dashboard-page">
        {shouldShowSetup ? (
          <TeamSetupPanel
            onCompleted={async () => {
              await reloadSession();
              navigate("/dashboard", { replace: true });
            }}
          />
        ) : null}
        {primaryTeam && !shouldShowSetup ? (
          <>
            <DashboardHeader dashboard={dashboard} onRefresh={handleRefreshDashboard} />
            {loading ? <p className="muted">Loading dashboard...</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            {dashboard ? <TeamBoard dashboard={dashboard} /> : null}
          </>
        ) : null}
      </main>
    </AppShell>
  );
}

function JoinCodeDisplay({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; code is still visible and selectable
    }
  }

  return (
    <span className="join-code-display">
      <span className="muted">Join code</span> <code className="mono">{joinCode}</code>
      <button className="button secondary button-sm" type="button" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </button>
    </span>
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
    <header className="page-header">
      <div>
        <span className="eyebrow">Team board</span>
        <h1>{dashboard?.team.name ?? "Team board"}</h1>
        <div className="header-stats">
          {dashboard?.team.joinCode ? <JoinCodeDisplay joinCode={dashboard.team.joinCode} /> : null}
          {dashboard?.team.joinCode ? <span className="dot">·</span> : null}
          <span>{dashboard?.goals.length ?? 0} goals tracked</span>
        </div>
      </div>
      <div className="header-actions">
        {refreshMessage ? <span className="muted">{refreshMessage}</span> : null}
        <Link className="button secondary" to="/dashboard/setup">
          Switch team
        </Link>
        <button className="button secondary" type="button" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
        <Link className="button" to="/dashboard/goals/new">
          Create goal
        </Link>
      </div>
    </header>
  );
}

function KpiStrip({ dashboard, passRateTrend }: { dashboard: Dashboard; passRateTrend: number[] }) {
  const kpis = deriveKpis(dashboard);

  return (
    <section className="kpi-strip" aria-label="Key quality metrics">
      <div className="kpi-card">
        <span className="eyebrow">Suite pass rate</span>
        <div className="kpi-value-row">
          <span className="kpi-value">
            {kpis.passRate ?? "–"}
            {kpis.passRate !== null ? <span className="kpi-unit">%</span> : null}
          </span>
        </div>
        {passRateTrend.length > 1 ? <Sparkline data={passRateTrend} height={30} color="#1a8a7a" /> : null}
      </div>
      <div className="kpi-card">
        <span className="eyebrow">Avg coverage</span>
        <div className="kpi-value-row">
          <span className="kpi-value">
            {kpis.avgCoverage ?? "–"}
            {kpis.avgCoverage !== null ? <span className="kpi-unit">%</span> : null}
          </span>
        </div>
        <span className="kpi-note">Across unit, API, and UI suites</span>
      </div>
      <div className="kpi-card">
        <span className="eyebrow">Goals at risk</span>
        <div className="kpi-value-row">
          <span className="kpi-value" style={kpis.atRisk > 0 ? { color: "#93341f" } : undefined}>
            {kpis.atRisk}
          </span>
        </div>
        <span className="kpi-note">of {kpis.totalGoals} total</span>
      </div>
      <div className="kpi-card">
        <span className="eyebrow">On track</span>
        <div className="kpi-value-row">
          <span className="kpi-value">{kpis.onTrack}</span>
          <span className="kpi-unit">/ {kpis.totalGoals}</span>
        </div>
        <span className="kpi-note">
          {kpis.active} active · {kpis.completed} completed
        </span>
      </div>
    </section>
  );
}

function ChartsRow({ passRatePoints }: { passRatePoints: number[] }) {
  const hasRealPassRate = passRatePoints.length > 1;

  return (
    <section className="charts-grid">
      <article className="chart-card">
        <div>
          <span className="eyebrow">Coverage over time</span>
          <h2>Test coverage · last 8 weeks</h2>
        </div>
        <p className="muted">Not enough history yet to chart a trend.</p>
      </article>

      <article className="chart-card">
        <div>
          <span className="eyebrow">Pass rate over time</span>
          <h2>Suite pass % · trending up</h2>
        </div>
        {hasRealPassRate ? (
          <AreaChart min={80} max={100} yTicks={[100, 90, 80]} values={passRatePoints} xLabels={["Earliest", "Latest"]} />
        ) : (
          <p className="muted">Not enough history yet to chart a trend.</p>
        )}
      </article>
    </section>
  );
}

function TeamBoard({ dashboard }: { dashboard: Dashboard }) {
  const groupedGoals = useMemo(() => groupGoals(dashboard.goals), [dashboard.goals]);
  const [passRateSeries, setPassRateSeries] = useState<TestsOverTimeRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    getTestsOverTime()
      .then((response) => {
        if (!cancelled) setPassRateSeries(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setPassRateSeries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryCards: CategoryCardData[] = useMemo(
    () =>
      (["unit", "api", "ui"] as const).map((category) => ({
        category,
        metrics: dashboard.metrics.filter((metric) => metric.category === category),
        sparkline: [],
      })),
    [dashboard.metrics],
  );

  const passRatePoints = passRateSeries.map((row) => (row.total > 0 ? Math.round((row.passed / row.total) * 100) : 0));

  return (
    <>
      <KpiStrip dashboard={dashboard} passRateTrend={passRatePoints} />
      <ChartsRow passRatePoints={passRatePoints} />

      <section className="board-section">
        <div className="section-title">
          <h2>By category</h2>
        </div>
        <CategoryMetricsRow cards={categoryCards} />
      </section>

      <section className="board-section">
        <div className="section-title">
          <h2>Team goals</h2>
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

function TeamSetupPanel({ onCompleted }: { onCompleted: () => Promise<void> }) {
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [newTeamJoinCode, setNewTeamJoinCode] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    const trimmedName = teamName.trim();

    if (!trimmedName) {
      setCreateError("Team name is required.");
      return;
    }

    setCreating(true);
    try {
      const result = await createTeam(trimmedName);
      if (result.team.joinCode) {
        setNewTeamJoinCode(result.team.joinCode);
      } else {
        await onCompleted();
      }
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Could not create team.");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoinError("");
    const trimmedCode = joinCode.trim();

    if (!trimmedCode) {
      setJoinError("Join code is required.");
      return;
    }

    setJoining(true);
    try {
      await joinTeam(trimmedCode);
      await onCompleted();
    } catch (err) {
      setJoinError(err instanceof ApiError ? err.message : "Could not join team.");
    } finally {
      setJoining(false);
    }
  }

  if (newTeamJoinCode) {
    return (
      <section className="join-panel">
        <span className="eyebrow">Team created</span>
        <h1>Your team is ready</h1>
        <p className="muted">Share this join code with your teammates so they can join your team.</p>
        <JoinCodeDisplay joinCode={newTeamJoinCode} />
        <div className="header-actions" style={{ marginTop: "1rem" }}>
          <button className="button" type="button" onClick={onCompleted}>
            Continue to dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="join-panel">
      <span className="eyebrow">Team access</span>
      <h1>Create or join a team</h1>
      <p className="muted">Start a new team or use an existing join code to open the dashboard.</p>

      <div className="stacked-form">
        <form className="inline-form" onSubmit={handleCreateTeam}>
          <label>
            Team name
            <input value={teamName} onChange={(event) => setTeamName(event.target.value)} />
          </label>
          <button className="button" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create team"}
          </button>
        </form>
        {createError ? <p className="form-error">{createError}</p> : null}

        <form className="inline-form" onSubmit={handleJoinTeam}>
          <label>
            Join code
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} />
          </label>
          <button className="button secondary" type="submit" disabled={joining}>
            {joining ? "Joining..." : "Join team"}
          </button>
        </form>
        {joinError ? <p className="form-error">{joinError}</p> : null}
      </div>
    </section>
  );
}
