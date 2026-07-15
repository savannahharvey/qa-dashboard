import type { ReactNode } from "react";

function scoreClass(score: number): string {
  if (score >= 75) {
    return "good";
  }
  if (score >= 50) {
    return "warn";
  }
  return "poor";
}

export function AnalyticsPanel({
  title,
  eyebrow,
  score,
  unavailableReason,
  children,
}: {
  title: string;
  eyebrow: string;
  score?: number;
  unavailableReason?: string;
  children?: ReactNode;
}) {
  return (
    <article className={`analytics-panel${unavailableReason ? " is-unavailable" : ""}`}>
      <header className="analytics-panel-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        {typeof score === "number" ? <span className={`score-badge ${scoreClass(score)}`}>{score}/100</span> : null}
      </header>
      {unavailableReason ? <p className="muted analytics-unavailable">{unavailableReason}</p> : children}
    </article>
  );
}
