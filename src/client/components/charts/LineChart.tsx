import { mkPoints, yFor } from "./chartMath";

export type LineSeries = { label: string; color: string; values: number[] };

export function LineChart({
  series,
  min,
  max,
  width = 640,
  height = 220,
  yTicks,
  xLabels,
}: {
  series: LineSeries[];
  min: number;
  max: number;
  width?: number;
  height?: number;
  yTicks?: number[];
  xLabels?: [string, string];
}) {
  const padL = 34;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const ticks = yTicks ?? [max, Math.round((max + min) / 2), min];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
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
        {series.map((s) => {
          const points = mkPoints(s.values, min, max, width, height, padL, padR, padT, padB);
          const lastValue = s.values[s.values.length - 1];
          const lastY = yFor(lastValue ?? min, min, max, height, padT, padB);
          return (
            <g key={s.label}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {lastValue !== undefined ? <circle cx={width - padR} cy={lastY} r={3.5} fill={s.color} /> : null}
            </g>
          );
        })}
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
