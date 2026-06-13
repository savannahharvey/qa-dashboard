import { AppShell } from "../components/AppShell";
import TestResultsOverTime from "../components/metrics/TestResultsOverTime";
import { useAuth } from "../state/AuthContext";

export function TestResultsPage() {
  const { primaryTeam } = useAuth();

  return (
    <AppShell>
      <main className="page">
        <section className="page-header">
          <div>
            <span className="eyebrow">Metrics</span>
            <h1>Test results over time</h1>
            <p className="muted">See test counts and pass percentage across time.</p>
          </div>
        </section>

        <section>
          <TestResultsOverTime repo={undefined} branch={undefined} />
        </section>
      </main>
    </AppShell>
  );
}

export default TestResultsPage;
