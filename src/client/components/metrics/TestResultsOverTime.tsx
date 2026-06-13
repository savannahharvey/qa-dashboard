import { useEffect, useMemo, useState } from "react";
import type { TestsOverTimeRow } from "../../api";

type Props = { repo?: string; branch?: string; from?: string; to?: string; granularity?: string };

function computePoints(data: TestsOverTimeRow[], width: number, height: number, padding = 24) {
  if (!data.length) return { total: [], passed: [], pct: [] };

  const xs = data.map((d, i) => padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1));
  const maxCount = Math.max(...data.map((d) => Math.max(d.total, d.passed)), 1);

  const total = data.map((d, i) => {
    const x = xs[i];
    const y = padding + (height - padding * 2) * (1 - d.total / maxCount);
    return { x, y };
  });

  const passed = data.map((d, i) => {
    const x = xs[i];
    const y = padding + (height - padding * 2) * (1 - d.passed / maxCount);
    return { x, y };
  });

  const pct = data.map((d, i) => {
    const x = xs[i];
    const y = padding + (height - padding * 2) * (1 - (d.passed / Math.max(1, d.total)) );
    return { x, y };
  });

  return { total, passed, pct };
}

export function TestResultsOverTime(props: Props) {
  const [data, setData] = useState<TestsOverTimeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    import("../../api").then(({ getTestsOverTime }) =>
      getTestsOverTime({ repo: props.repo, branch: props.branch, from: props.from, to: props.to, granularity: props.granularity })
        .then((res) => {
          if (!cancelled) setData(res.data ?? []);
        })
        .catch((err) => {
          if (!cancelled) setError("Could not load metrics");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        }),
    );

    return () => {
      cancelled = true;
    };
  }, [props.repo, props.branch, props.from, props.to, props.granularity]);

  const rows = useMemo(() => data || [], [data]);

  if (loading) return <p className="muted">Loading chart...</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!rows.length) return <p className="muted">No data available.</p>;

  const width = 700;
  const height = 220;
  const pts = computePoints(rows, width, height);

  const pathFor = (ptsArr: { x: number; y: number }[]) => ptsArr.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="chart-card">
      <h3>Tests Over Time</h3>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" role="img" aria-label="Tests over time">
        {/* grid lines */}
        <rect x={0} y={0} width={width} height={height} fill="none" />
        <path d={pathFor(pts.total)} fill="none" stroke="#2b7aee" strokeWidth={2} />
        <path d={pathFor(pts.passed)} fill="none" stroke="#2ecc71" strokeWidth={2} />

        {/* points */}
        {pts.total.map((p, i) => (
          <circle key={`t-${i}`} cx={p.x} cy={p.y} r={2.5} fill="#2b7aee" />
        ))}
        {pts.passed.map((p, i) => (
          <circle key={`p-${i}`} cx={p.x} cy={p.y} r={2.5} fill="#2ecc71" />
        ))}

        {/* x-axis date labels */}
        {rows.map((r, i) => {
          const p = pts.total[i];
          if (!p) return null;
          let label = r.period;
          try {
            const d = new Date(r.period);
            if (!Number.isNaN(d.getTime())) {
              label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            }
          } catch (e) {
            /* ignore */
          }

          return (
            <text key={`l-${i}`} x={p.x} y={height - 6} fontSize={10} fill="#444" textAnchor="middle">
              {label}
            </text>
          );
        })}
      </svg>

      <div className="chart-legend">
        <span><strong style={{color:'#2b7aee'}}>●</strong> Total tests</span>
        <span><strong style={{color:'#2ecc71'}}>●</strong> Passed tests</span>
      </div>
    </div>
  );
}

export default TestResultsOverTime;
