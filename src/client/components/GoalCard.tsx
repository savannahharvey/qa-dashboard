import { Link } from "react-router-dom";
import { categoryLabels, metricLabels, progressPercent, statusClass, statusLabels } from "../domain/display";
import type { Goal } from "../types";
import { Avatar } from "./Avatar";

export function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const percent = progressPercent(goal);
  const ownerName = goal.ownerName ?? "Unassigned";

  return (
    <article className={compact ? "goal-card compact" : "goal-card"}>
      <div className="goal-card-header">
        <div style={{ minWidth: 0 }}>
          <span className="eyebrow">{goal.scope === "team" ? "Team goal" : `Supports · ${ownerName}`}</span>
          <h3>{goal.title}</h3>
        </div>
        <div className="goal-card-header-actions">
          <span className={statusClass(goal.status)}>{statusLabels[goal.status]}</span>
          <Link className="button secondary button-sm" to={`/dashboard/goals/${goal.id}/edit`}>
            Edit
          </Link>
        </div>
      </div>
      {goal.description ? <p>{goal.description}</p> : null}
      {goal.scope === "team" ? (
        <div className="goal-meta">
          {goal.metricType ? <span>{metricLabels[goal.metricType]}</span> : null}
          {goal.testCategory ? <span>{categoryLabels[goal.testCategory]}</span> : null}
        </div>
      ) : null}
      <div className="progress-row" aria-label={`${goal.title} progress ${percent}%`}>
        <div className="progress-track">
          <span className={`progress-fill ${goal.status}`} style={{ width: `${percent}%` }} />
        </div>
        <strong className={`progress-percent ${goal.status}`}>{percent}%</strong>
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
      {goal.scope === "team" ? (
        <div className="goal-owner">
          <Avatar name={ownerName} light />
          <span className="owner-name">{ownerName}</span>
        </div>
      ) : null}
    </article>
  );
}
