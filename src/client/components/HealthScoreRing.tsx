export function scoreColor(score: number | null): string {
  if (score === null) {
    return "var(--muted-soft)";
  }
  if (score >= 75) {
    return "#0e5a62";
  }
  if (score >= 50) {
    return "#c69a43";
  }
  return "#b1482f";
}

export function HealthScoreRing({ score }: { score: number | null }) {
  const size = 140;
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score ?? 0;
  const offset = circumference - (pct / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`QA health score ${score ?? "unavailable"} of 100`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-soft)" strokeWidth={stroke} />
      {score !== null ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : null}
      <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fontSize="2rem" fontWeight={600} fill="var(--text)" fontFamily="var(--font-mono)">
        {score === null ? "–" : score}
      </text>
      <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" fontSize="0.7rem" fill="var(--muted)" letterSpacing="0.08em">
        / 100
      </text>
    </svg>
  );
}
