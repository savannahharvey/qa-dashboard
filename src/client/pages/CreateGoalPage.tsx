import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, createGoal, getDashboard } from "../api";
import { AppShell } from "../components/AppShell";
import { categoryLabels, metricLabels } from "../domain/display";
import { useAuth } from "../state/AuthContext";
import type { Dashboard, GoalInput, GoalScope, MetricKind, TestCategory } from "../types";

const metricOptions: MetricKind[] = ["test-coverage", "tests-passing"];
const categoryOptions: TestCategory[] = ["unit", "api", "ui"];

export function CreateGoalPage() {
  const navigate = useNavigate();
  const { user, primaryTeam } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    scope: "team" as GoalScope,
    ownerId: user?.id ?? "",
    parentGoalId: "",
    metricType: "test-coverage" as MetricKind,
    testCategory: "unit" as TestCategory,
    currentValue: "0",
    targetValue: "100",
    unit: "%",
    dueDate: "",
  });

  useEffect(() => {
    if (!primaryTeam) return;
    void getDashboard(primaryTeam.id).then(setDashboard);
  }, [primaryTeam]);

  useEffect(() => {
    if (user && !form.ownerId) {
      setForm((current) => ({ ...current, ownerId: user.id }));
    }
  }, [form.ownerId, user]);

  const owners = useMemo(() => {
    const byId = new Map<string, string>();
    if (user) byId.set(user.id, user.displayName ?? user.username);
    dashboard?.goals.forEach((goal) => byId.set(goal.ownerId, goal.ownerName ?? goal.ownerId));
    return Array.from(byId, ([id, name]) => ({ id, name }));
  }, [dashboard, user]);

  const teamGoals = dashboard?.goals.filter((goal) => goal.scope === "team") ?? [];

  if (!primaryTeam) {
    return (
      <AppShell>
        <main className="dashboard-page">
          <section className="empty-state">
            <h1>Join a team first</h1>
            <p className="muted">A goal needs a team before it can be saved.</p>
            <Link className="button" to="/dashboard">
              Back to dashboard
            </Link>
          </section>
        </main>
      </AppShell>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!primaryTeam) return;
    setSubmitting(true);
    setError("");
    setFields({});

    const payload: GoalInput = {
      title: form.title,
      description: form.description.trim() ? form.description.trim() : null,
      scope: form.scope,
      ownerId: form.ownerId,
      parentGoalId: form.scope === "individual" && form.parentGoalId ? form.parentGoalId : null,
      metricType: form.metricType,
      testCategory: form.testCategory,
      currentValue: Number(form.currentValue),
      targetValue: Number(form.targetValue),
      unit: form.unit.trim() ? form.unit.trim() : null,
      dueDate: form.dueDate || null,
    };

    try {
      await createGoal(primaryTeam.id, payload);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFields(err.fields);
      } else {
        setError("Goal could not be saved.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <main className="dashboard-page">
        <section className="page-header">
          <div>
            <span className="eyebrow">Goal tracking</span>
            <h1>Create goal</h1>
            <p className="muted">Add a team goal or an individual goal that supports the current team board.</p>
          </div>
          <Link className="button secondary" to="/dashboard">
            Back
          </Link>
        </section>

        <form className="goal-form" onSubmit={handleSubmit}>
          <label className="span-2">
            Title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            {fields.title ? <span className="field-error">{fields.title}</span> : null}
          </label>
          <label className="span-2">
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label>
            Scope
            <select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value as GoalScope })}>
              <option value="team">Team goal</option>
              <option value="individual">Individual goal</option>
            </select>
          </label>
          <label>
            Owner
            <select value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
            {fields.ownerId ? <span className="field-error">{fields.ownerId}</span> : null}
          </label>
          {form.scope === "individual" ? (
            <label className="span-2">
              Parent team goal
              <select value={form.parentGoalId} onChange={(event) => setForm({ ...form, parentGoalId: event.target.value })}>
                <option value="">No parent goal</option>
                {teamGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
              {fields.parentGoalId ? <span className="field-error">{fields.parentGoalId}</span> : null}
            </label>
          ) : null}
          <label>
            Metric type
            <select value={form.metricType} onChange={(event) => setForm({ ...form, metricType: event.target.value as MetricKind })}>
              {metricOptions.map((metric) => (
                <option key={metric} value={metric}>
                  {metricLabels[metric]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Test category
            <select
              value={form.testCategory}
              onChange={(event) => setForm({ ...form, testCategory: event.target.value as TestCategory })}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Current value
            <input value={form.currentValue} inputMode="decimal" onChange={(event) => setForm({ ...form, currentValue: event.target.value })} />
            {fields.currentValue ? <span className="field-error">{fields.currentValue}</span> : null}
          </label>
          <label>
            Target value
            <input value={form.targetValue} inputMode="decimal" onChange={(event) => setForm({ ...form, targetValue: event.target.value })} />
            {fields.targetValue ? <span className="field-error">{fields.targetValue}</span> : null}
          </label>
          <label>
            Unit
            <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
          </label>
          <label>
            Due date
            <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            {fields.dueDate ? <span className="field-error">{fields.dueDate}</span> : null}
          </label>
          {error ? <p className="form-error span-2">{error}</p> : null}
          <div className="form-actions span-2">
            <Link className="button secondary" to="/dashboard">
              Cancel
            </Link>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save goal"}
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}
