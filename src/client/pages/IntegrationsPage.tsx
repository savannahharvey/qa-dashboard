import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiError,
  getAzurePipelines,
  getGithubIntegration,
  getMetricSourceConfig,
  refreshMetrics,
  saveGithubIntegration,
  saveMetricSourceConfig,
  type AzurePipelineDefinition,
  type Diagnostic,
  type GithubConnectivity,
} from "../api";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../state/AuthContext";

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

export function IntegrationsPage() {
  const { primaryTeam } = useAuth();

  return (
    <AppShell>
      <main className="page">
        <header className="page-header">
          <div>
            <span className="eyebrow">Connect</span>
            <h1>Integrations</h1>
            <p className="muted">Bring in your pipeline and repository so goals, metrics, and insights reflect live signals.</p>
          </div>
        </header>

        <section className="integrations-grid">
          {primaryTeam ? (
            <>
              <AzureDevOpsCard teamId={primaryTeam.id} />
              <GitHubCard teamId={primaryTeam.id} />
            </>
          ) : (
            <article className="integration-card">
              <p className="muted">Join a team to configure your integrations.</p>
            </article>
          )}
        </section>

        <section className="board-section">
          <span className="more-sources-label">More sources</span>
          <div className="more-sources-grid">
            <div className="coming-soon-card">
              <div className="coming-soon-name">
                <span className="coming-soon-mark">JK</span>
                <span style={{ fontWeight: 600, color: "#52605d" }}>Jenkins</span>
              </div>
              <span className="coming-soon-tag">Coming soon</span>
            </div>
            <div className="coming-soon-card">
              <div className="coming-soon-name">
                <span className="coming-soon-mark">JR</span>
                <span style={{ fontWeight: 600, color: "#52605d" }}>Jira</span>
              </div>
              <span className="coming-soon-tag">Coming soon</span>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function githubStatusBadge(loading: boolean, enabled: boolean, status: GithubConnectivity["status"]) {
  if (loading) {
    return { className: "status unavailable", label: "Loading..." };
  }
  if (!enabled) {
    return { className: "status unavailable", label: "Not connected" };
  }
  if (status === "connected") {
    return { className: "status passing", label: "● Connected" };
  }
  if (status === "error") {
    return { className: "status failing", label: "Connection error" };
  }
  return { className: "status unavailable", label: "Enabled" };
}

function GitHubCard({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [hasPat, setHasPat] = useState(false);
  const [editingPat, setEditingPat] = useState(true);
  const [patInput, setPatInput] = useState("");
  const [status, setStatus] = useState<GithubConnectivity>({ status: "idle" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadGithubConfig() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const { config, status: liveStatus } = await getGithubIntegration(teamId);
        if (cancelled) return;

        setEnabled(config?.enabled ?? false);
        setRepoUrl(config?.settings.repoUrl ?? "");
        setBranch(config?.settings.branch ?? "main");
        setHasPat(config?.hasPat ?? false);
        setEditingPat(!config?.hasPat);
        setPatInput("");
        setStatus(liveStatus);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load GitHub settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadGithubConfig();

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  async function persist(nextPat: string | undefined, successMessage: string) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await saveGithubIntegration(teamId, {
        enabled,
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || "main",
        ...(nextPat !== undefined ? { pat: nextPat } : {}),
      });
      setHasPat(response.hasPat);
      setEditingPat(!response.hasPat);
      setPatInput("");
      setStatus(response.status);
      setMessage(successMessage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.fields.repoUrl ?? err.message);
      } else {
        setError("Could not save GitHub settings.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persist(editingPat ? patInput.trim() : undefined, "GitHub settings saved.");
  }

  async function handleClearPat() {
    await persist("", "GitHub personal access token cleared.");
  }

  const badge = githubStatusBadge(loading, enabled, status.status);

  return (
    <article className="integration-card">
      <div className="integration-card-head">
        <div className="integration-title">
          <span className="integration-mark github">GH</span>
          <div>
            <div className="integration-name">GitHub</div>
            <div className="integration-sub">Code surface &amp; PR checks</div>
          </div>
        </div>
        <span className={badge.className}>{badge.label}</span>
      </div>

      <form className="stacked-form" onSubmit={handleSubmit}>
        <label className="inline-toggle">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span>Enable GitHub connection</span>
        </label>

        <label>
          <span>Repository URL</span>
          <input
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="github.com/acme/qa-dashboard"
          />
        </label>

        <label>
          <span>Default branch</span>
          <input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" />
        </label>

        {editingPat ? (
          <label>
            <span>Personal access token (optional)</span>
            <input
              type="password"
              value={patInput}
              onChange={(event) => setPatInput(event.target.value)}
              placeholder="Paste a GitHub PAT for private repos"
              autoComplete="off"
            />
          </label>
        ) : (
          <div className="form-field">
            <span>Personal access token</span>
            <div className="azure-pat-saved">
              <span className="muted">PAT saved</span>
              <button className="button secondary" type="button" onClick={() => setEditingPat(true)}>
                Replace
              </button>
              <button className="button secondary" type="button" onClick={handleClearPat} disabled={saving}>
                Clear
              </button>
            </div>
          </div>
        )}

        <span className="integration-note">
          Public repositories connect without a token. Add a personal access token to reach private repositories.
        </span>

        <div className="integration-actions">
          {message ? <span className="muted">{message}</span> : null}
          <button className="button" type="submit" disabled={saving || loading}>
            {saving ? "Saving..." : hasPat || enabled ? "Save GitHub settings" : "Connect repository"}
          </button>
        </div>
      </form>

      {status.status === "error" && status.message ? <p className="form-error">{status.message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}

function AzureDevOpsCard({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [pipelinesMessage, setPipelinesMessage] = useState("");
  const [error, setError] = useState("");
  const [pipelines, setPipelines] = useState<AzurePipelineDefinition[]>([]);
  const [pipelinesLoading, setPipelinesLoading] = useState(false);
  const [draft, setDraft] = useState<AzureConfigDraft>(defaultAzureDraft);
  const [editingPat, setEditingPat] = useState(true);
  const [patInput, setPatInput] = useState("");
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
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
        setEditingPat(!config?.hasPat);
        setPatInput("");

        if (config?.enabled) {
          const pipelinesResponse = await getAzurePipelines(teamId);
          if (!cancelled) {
            setPipelines(pipelinesResponse.pipelines);
            setDiagnostics(pipelinesResponse.diagnostics);
            setPipelinesMessage(
              pipelinesResponse.diagnostics.length === 0
                ? pipelinesResponse.pipelines.length > 0
                  ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.`
                  : "No pipelines were found."
                : "",
            );
          }
        } else if (!cancelled) {
          setPipelines([]);
          setPipelinesMessage("");
          setDiagnostics([]);
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
      const pipelinesResponse = await getAzurePipelines(teamId);
      setPipelines(pipelinesResponse.pipelines);
      setDiagnostics(pipelinesResponse.diagnostics);
      setPipelinesMessage(
        pipelinesResponse.diagnostics.length === 0
          ? pipelinesResponse.pipelines.length > 0
            ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.`
            : "No pipelines were found."
          : "",
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
        ...(editingPat ? { pat: patInput.trim() } : {}),
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
      setEditingPat(!reloaded.config?.hasPat);
      setPatInput("");
      if (reloaded.config?.enabled) {
        try {
          const pipelinesResponse = await getAzurePipelines(teamId);
          setPipelines(pipelinesResponse.pipelines);
          setDiagnostics(pipelinesResponse.diagnostics);
          setPipelinesMessage(
            pipelinesResponse.diagnostics.length === 0
              ? pipelinesResponse.pipelines.length > 0
                ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.`
                : "No pipelines were found."
              : "",
          );
        } catch {
          setPipelines([]);
          setPipelinesMessage("Pipeline list could not be refreshed.");
        }
      } else {
        setPipelines([]);
        setPipelinesMessage("");
        setDiagnostics([]);
      }
      setMessage("Azure DevOps settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save Azure settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClearPat() {
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
        pat: "",
      });
      setEditingPat(true);
      setPatInput("");
      setMessage("Azure DevOps PAT cleared.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not clear the Azure DevOps PAT.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setMessage("");
    try {
      const response = await refreshMetrics(teamId);
      setDiagnostics(response.diagnostics);
      setMessage(response.diagnostics.length === 0 ? "Metrics synced." : "");
    } catch {
      setMessage("Sync could not complete.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <article className="integration-card">
      <div className="integration-card-head">
        <div className="integration-title">
          <span className="integration-mark azure">AZ</span>
          <div>
            <div className="integration-name">Azure DevOps</div>
            <div className="integration-sub">Test results &amp; coverage</div>
          </div>
        </div>
        <span className={`status ${draft.enabled ? "passing" : "unavailable"}`}>
          {loading ? "Loading..." : draft.enabled ? "● Connected" : "Disabled"}
        </span>
      </div>

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

        {editingPat ? (
          <label>
            <span>Personal access token</span>
            <input
              type="password"
              value={patInput}
              onChange={(event) => setPatInput(event.target.value)}
              placeholder="Paste an Azure DevOps PAT"
              autoComplete="off"
            />
          </label>
        ) : (
          <div className="form-field">
            <span>Personal access token</span>
            <div className="azure-pat-saved">
              <span className="muted">PAT saved</span>
              <button className="button secondary" type="button" onClick={() => setEditingPat(true)}>
                Replace
              </button>
              <button className="button secondary" type="button" onClick={handleClearPat} disabled={saving}>
                Clear
              </button>
            </div>
          </div>
        )}

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

        <div>
          <span className="eyebrow">Category mapping</span>
          <p className="muted" style={{ marginTop: "0.3rem", fontSize: "0.85rem" }}>
            A run is categorised when its title contains any of these words.
          </p>
        </div>
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

        <div className="integration-actions">
          {message ? <span className="muted">{message}</span> : null}
          <button className="button secondary" type="button" onClick={handleSyncNow} disabled={syncing || !draft.enabled}>
            {syncing ? "Syncing..." : "Sync now"}
          </button>
          <button className="button" type="submit" disabled={saving || loading}>
            {saving ? "Saving..." : "Save Azure settings"}
          </button>
        </div>
      </form>

      {diagnostics.map((diagnostic, index) => (
        <p key={index} className="form-error">
          {diagnostic.message}
        </p>
      ))}
      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}

export default IntegrationsPage;
