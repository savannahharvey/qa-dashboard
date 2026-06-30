import { Link } from "react-router-dom";
import { categoryLabels, metricLabels, progressPercent, statusClass, statusLabels } from "../domain/display";
import type { Goal } from "../types";

export function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const percent = progressPercent(goal);

  return (
    <article className={compact ? "goal-card compact" : "goal-card"}>
      <div className="goal-card-header">
        <div>
          <span className="eyebrow">{goal.scope === "team" ? "Team goal" : "Individual goal"}</span>
          <h3>{goal.title}</h3>
        </div>
          <span className={statusClass(goal.status)}>{statusLabels[goal.status]}</span>
        <Link className="button secondary small" to={`/dashboard/goals/${goal.id}/edit`}>
          Edit
        </Link>
      </div>
      {goal.description ? <p>{goal.description}</p> : null}
      <div className="goal-meta">
        <span>{goal.ownerName ?? "Unassigned"}</span>
        {goal.metricType ? <span>{metricLabels[goal.metricType]}</span> : null}
        {goal.testCategory ? <span>{categoryLabels[goal.testCategory]}</span> : null}
      </div>
      <div className="progress-row" aria-label={`${goal.title} progress ${percent}%`}>
        <div className="progress-track">
          <span style={{ width: `${percent}%` }} />
        </div>
        <strong>{percent}%</strong>
      </div>
      <div className="goal-values">
        <span>
          <strong>{goal.currentValue}</strong>
          {goal.unit ?? ""}
        </span>
        <span>
          target <strong>{goal.targetValue}</strong>
          {goal.unit ?? ""}
        </span>
      </div>
    </article>
  );
}
