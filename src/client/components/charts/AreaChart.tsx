import { mkAreaPath, mkPoints, yFor } from "./chartMath";

export function AreaChart({
  values,
  min,
  max,
  width = 640,
  height = 200,
  color = "#1a8a7a",
  yTicks,
  xLabels,
  gradientId = "area-fill",
}: {
  values: number[];
  min: number;
  max: number;
  width?: number;
  height?: number;
  color?: string;
  yTicks?: number[];
  xLabels?: [string, string];
  gradientId?: string;
}) {
  const padL = 34;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const ticks = yTicks ?? [max, Math.round((max + min) / 2), min];
  const points = mkPoints(values, min, max, width, height, padL, padR, padT, padB);
  const area = mkAreaPath(values, min, max, width, height, padL, padR, padT, padB);
  const lastValue = values[values.length - 1];
  const lastY = yFor(lastValue ?? min, min, max, height, padT, padB);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={0.22} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {ticks.map((tick) => {
          const y = yFor(tick, min, max, height, padT, padB);
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={width} y2={y} stroke="#eef2f0" />
              <text x={4} y={y + 4} className="mono" fill="#a4b0ab" fontSize={11}>
                {tick}
              </text>
            </g>
          );
        })}
        {values.length > 0 ? <path d={area} fill={`url(#${gradientId})`} /> : null}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {lastValue !== undefined ? <circle cx={width - padR} cy={lastY} r={4} fill={color} /> : null}
      </svg>
      {xLabels ? (
        <div className="chart-axis-labels">
          <span>{xLabels[0]}</span>
          <span>{xLabels[1]}</span>
        </div>
      ) : null}
    </div>
  );
}
