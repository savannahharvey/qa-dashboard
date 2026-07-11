import { AppShell } from "../components/AppShell";

export function InsightsPage() {
  return (
    <AppShell>
      <main className="page">
        <header>
          <span className="eyebrow">Analytics</span>
          <h1>Insights</h1>
          <p className="muted" style={{ maxWidth: "46rem" }}>
            Signals derived from your connected pipeline and repository — CI/CD readiness, test pyramid balance, user
            flow coverage, and quality gaps by feature.
          </p>
        </header>

        <div className="empty-state">
          <h3>No insights yet</h3>
          <p className="muted">
            Connect a pipeline and repository on the Integrations page to start generating CI/CD readiness, test
            pyramid, user flow, and quality signals for your team.
          </p>
        </div>
      </main>
    </AppShell>
  );
}

export default InsightsPage;
