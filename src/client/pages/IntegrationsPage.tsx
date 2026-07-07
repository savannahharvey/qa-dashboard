import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiError,
  getAzurePipelines,
  getMetricSourceConfig,
  refreshMetrics,
  saveMetricSourceConfig,
  type AzurePipelineDefinition,
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
            <p className="muted">
              Bring in your pipeline and repository so goals, metrics, and insights reflect live signals instead of
              sample data.
            </p>
          </div>
        </header>

        <section className="integrations-grid">
          {primaryTeam ? (
            <AzureDevOpsCard teamId={primaryTeam.id} />
          ) : (
            <article className="integration-card">
              <p className="muted">Join a team to configure Azure DevOps.</p>
            </article>
          )}
          <GitHubCard />
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

function GitHubCard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");

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
        <span className="status unavailable">Not connected</span>
      </div>
      <div className="integration-form">
        <label>
          Repository URL
          <input
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="github.com/acme/qa-dashboard"
          />
        </label>
        <label>
          Default branch
          <input value={branch} onChange={(event) => setBranch(event.target.value)} />
        </label>
        <span className="integration-note">
          GitHub integration isn&apos;t available yet — connecting a repository here doesn&apos;t do anything yet.
        </span>
      </div>
      <div className="integration-actions">
        <button className="button" type="button" disabled title="Not yet available">
          Connect repository
        </button>
      </div>
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
              pipelinesResponse.pipelines.length > 0
                ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.`
                : "No pipelines were found.",
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
      setPipelinesMessage(
        pipelinesResponse.pipelines.length > 0
          ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.`
          : "No pipelines were found.",
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
            pipelinesResponse.pipelines.length > 0
              ? `Loaded ${pipelinesResponse.pipelines.length} pipelines.`
              : "No pipelines were found.",
          );
        } catch {
          setPipelines([]);
          setPipelinesMessage("Pipeline list could not be refreshed.");
        }
      } else {
        setPipelines([]);
        setPipelinesMessage("");
      }
      setMessage("Azure DevOps settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save Azure settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setMessage("");
    try {
      await refreshMetrics(teamId);
      setMessage("Metrics synced.");
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

      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}

export default IntegrationsPage;
