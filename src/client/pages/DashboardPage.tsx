import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ApiError,
  createTeam,
  getAzurePipelines,
  getDashboard,
  getMetricSourceConfig,
  joinTeam,
  refreshMetrics,
  saveMetricSourceConfig,
  type AzurePipelineDefinition,
} from "../api";
import { AppShell } from "../components/AppShell";
import { GoalCard } from "../components/GoalCard";
import { categoryLabels, formatMetricValue, groupGoals, metricLabels, statusClass } from "../domain/display";
import { useAuth } from "../state/AuthContext";
import type { Dashboard } from "../types";

type AzureConfigDraft = {
  enabled: boolean;
  organization: string;
  project: string;
  buildDefinitionId: string;
  categoryMap: {
    unit: string;
    api: string;
    ui: string;
  };
};

const defaultAzureDraft = (): AzureConfigDraft => ({
  enabled: false,
  organization: "",
  project: "",
  buildDefinitionId: "",
  categoryMap: {
    unit: "unit",
    api: "api",
    ui: "ui",
  },
});

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

  async function handleAzureConfigSaved() {
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
            <AzureDevOpsConfigPanel teamId={primaryTeam.id} onSaved={handleAzureConfigSaved} />
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
        <Link className="button secondary" to="/dashboard/setup">
          Switch team
        </Link>
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

function AzureDevOpsConfigPanel({ teamId, onSaved }: { teamId: string; onSaved: () => Promise<unknown> }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pipelinesMessage, setPipelinesMessage] = useState("");
  const [error, setError] = useState("");
  const [pipelines, setPipelines] = useState<AzurePipelineDefinition[]>([]);
  const [pipelinesLoading, setPipelinesLoading] = useState(false);
  const [draft, setDraft] = useState<AzureConfigDraft>(defaultAzureDraft);
  const selectedPipeline = useMemo(
    () => pipelines.find((pipeline) => String(pipeline.id) === draft.buildDefinitionId),
    [draft.buildDefinitionId, pipelines],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAzureConfig() {
      setLoading(true);
      setPipelinesLoading(true);
      setError("");
      setPipelinesMessage("");

      try {
        const { config } = await getMetricSourceConfig(teamId);
        if (cancelled) return;

        const settings = config?.settings ?? {};
        const categoryMap = settings.categoryMap ?? {};

        setDraft({
          enabled: config?.enabled ?? false,
          organization: typeof settings.organization === "string" ? settings.organization : "",
          project: typeof settings.project === "string" ? settings.project : "",
          buildDefinitionId: typeof settings.buildDefinitionId === "number" ? String(settings.buildDefinitionId) : "",
          categoryMap: {
            unit: categoryMap.unit?.runTitleIncludes ?? "unit",
            api: categoryMap.api?.runTitleIncludes ?? "api",
            ui: categoryMap.ui?.runTitleIncludes ?? "ui",
          },
        });

        if (config?.enabled) {
          const pipelinesResponse = await getAzurePipelines(teamId);
          if (!cancelled) {
            setPipelines(pipelinesResponse.pipelines);
            setPipelinesMessage(
              pipelinesResponse.pipelines.length > 0 ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.` : "No pipelines were found.",
            );
          }
        } else if (!cancelled) {
          setPipelines([]);
          setPipelinesMessage("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load Azure settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPipelinesLoading(false);
        }
      }
    }

    void loadAzureConfig();

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  async function handleReloadPipelines() {
    if (!draft.enabled) {
      setPipelines([]);
      setPipelinesMessage("Enable Azure DevOps metrics before loading pipelines.");
      return;
    }

    if (!draft.organization.trim() || !draft.project.trim()) {
      setPipelines([]);
      setPipelinesMessage("Organization and project are required to load pipelines.");
      return;
    }

    setPipelinesLoading(true);
    setError("");
    setPipelinesMessage("");

    try {
      const pipelinesResponse = await getAzurePipelines(teamId);
      setPipelines(pipelinesResponse.pipelines);
      setPipelinesMessage(
        pipelinesResponse.pipelines.length > 0 ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.` : "No pipelines were found.",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reload Azure pipelines.");
    } finally {
      setPipelinesLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const buildDefinitionId = draft.buildDefinitionId.trim() ? Number(draft.buildDefinitionId) : undefined;
      await saveMetricSourceConfig(teamId, {
        source: "AZURE_DEVOPS",
        enabled: draft.enabled,
        settings: {
          organization: draft.organization.trim(),
          project: draft.project.trim(),
          ...(Number.isFinite(buildDefinitionId) ? { buildDefinitionId } : {}),
          categoryMap: {
            unit: { runTitleIncludes: draft.categoryMap.unit.trim() || "unit" },
            api: { runTitleIncludes: draft.categoryMap.api.trim() || "api" },
            ui: { runTitleIncludes: draft.categoryMap.ui.trim() || "ui" },
          },
        },
      });
      const reloaded = await getMetricSourceConfig(teamId);
      const settings = reloaded.config?.settings ?? {};
      const categoryMap = settings.categoryMap ?? {};
      setDraft({
        enabled: reloaded.config?.enabled ?? false,
        organization: typeof settings.organization === "string" ? settings.organization : "",
        project: typeof settings.project === "string" ? settings.project : "",
        buildDefinitionId: typeof settings.buildDefinitionId === "number" ? String(settings.buildDefinitionId) : "",
        categoryMap: {
          unit: categoryMap.unit?.runTitleIncludes ?? "unit",
          api: categoryMap.api?.runTitleIncludes ?? "api",
          ui: categoryMap.ui?.runTitleIncludes ?? "ui",
        },
      });
      if (reloaded.config?.enabled) {
        try {
          const pipelinesResponse = await getAzurePipelines(teamId);
          setPipelines(pipelinesResponse.pipelines);
          setPipelinesMessage(
            pipelinesResponse.pipelines.length > 0 ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.` : "No pipelines were found.",
          );
        } catch {
          setPipelines([]);
          setPipelinesMessage("Pipeline list could not be refreshed.");
        }
      } else {
        setPipelines([]);
        setPipelinesMessage("");
      }
      await onSaved();
      setMessage("Azure DevOps settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save Azure settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="board-section">
      <div className="section-title">
        <div>
          <span className="eyebrow">Azure DevOps</span>
          <h2>Connection settings</h2>
        </div>
        <span className="muted">{loading ? "Loading..." : draft.enabled ? "Enabled" : "Disabled"}</span>
      </div>

      <p className="muted">
        Save your Azure DevOps organization and project here. The PAT stays server-side in environment variables.
      </p>

      <form className="stacked-form" onSubmit={handleSubmit}>
        <label className="inline-toggle">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
          />
          <span>Enable Azure DevOps metrics</span>
        </label>

        <label>
          <span>Organization</span>
          <input
            value={draft.organization}
            onChange={(event) => setDraft((current) => ({ ...current, organization: event.target.value }))}
            placeholder="your-organization"
          />
        </label>

        <label>
          <span>Project</span>
          <input
            value={draft.project}
            onChange={(event) => setDraft((current) => ({ ...current, project: event.target.value }))}
            placeholder="your-project"
          />
        </label>

        <label>
          <span>Pipeline</span>
          <select
            value={draft.buildDefinitionId}
            onChange={(event) => setDraft((current) => ({ ...current, buildDefinitionId: event.target.value }))}
            disabled={pipelinesLoading || pipelines.length === 0}
          >
            <option value="">Any pipeline</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        </label>
        <div className="azure-pipeline-meta">
          <span className="muted">
            {selectedPipeline ? `Selected pipeline: ${selectedPipeline.name}` : "Selected pipeline: Any pipeline"}
          </span>
          <button className="button secondary" type="button" onClick={handleReloadPipelines} disabled={pipelinesLoading}>
            {pipelinesLoading ? "Reloading..." : "Reload pipelines"}
          </button>
        </div>
        {pipelinesMessage ? <p className="muted azure-pipeline-message">{pipelinesMessage}</p> : null}

        <div className="metrics-grid azure-config-grid">
          <label>
            <span>Unit run title includes</span>
            <input
              value={draft.categoryMap.unit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  categoryMap: { ...current.categoryMap, unit: event.target.value },
                }))
              }
            />
          </label>
          <label>
            <span>API run title includes</span>
            <input
              value={draft.categoryMap.api}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  categoryMap: { ...current.categoryMap, api: event.target.value },
                }))
              }
            />
          </label>
          <label>
            <span>UI run title includes</span>
            <input
              value={draft.categoryMap.ui}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  categoryMap: { ...current.categoryMap, ui: event.target.value },
                }))
              }
            />
          </label>
        </div>

        <div className="header-actions">
          {message ? <span className="muted">{message}</span> : null}
          <button className="button secondary" type="submit" disabled={saving || loading}>
            {saving ? "Saving..." : "Save Azure settings"}
          </button>
        </div>
      </form>

      {error ? <p className="form-error">{error}</p> : null}
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

function TeamSetupPanel({ onCompleted }: { onCompleted: () => Promise<void> }) {
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
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
      await createTeam(trimmedName);
      await onCompleted();
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
