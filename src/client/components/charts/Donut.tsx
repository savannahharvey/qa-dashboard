export function Donut({
  score,
  max = 100,
  size = 150,
  strokeWidth = 14,
  color = "#0e5a62",
  caption,
}: {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  caption?: string;
}) {
  const r = 52;
  const viewSize = 140;
  const circumference = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, score / max));
  const dash = `${(filled * circumference).toFixed(1)} ${circumference.toFixed(1)}`;

  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${viewSize} ${viewSize}`} style={{ width: size, height: size }}>
        <circle cx={viewSize / 2} cy={viewSize / 2} r={r} fill="none" stroke="#eef2f0" strokeWidth={strokeWidth} />
        <circle
          cx={viewSize / 2}
          cy={viewSize / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dash}
          transform={`rotate(-90 ${viewSize / 2} ${viewSize / 2})`}
        />
      </svg>
      <div className="donut-center">
        <span className="donut-score mono">{score}</span>
        <span className="donut-caption">{caption ?? `/ ${max}`}</span>
      </div>
    </div>
  );
}
