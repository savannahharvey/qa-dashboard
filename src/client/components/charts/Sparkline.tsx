import { autoRange, mkPoints } from "./chartMath";

export function Sparkline({
  data,
  width = 120,
  height = 44,
  color = "#0e5a62",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data.length) return null;
  const [min, max] = autoRange(data);
  const points = mkPoints(data, min, max, width, height, 3, 3, 6, 6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
