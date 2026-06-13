# Test Results Over Time

Endpoint: `GET /api/metrics/tests-over-time`

Query parameters:
- `repo` (optional) — repository id or name
- `branch` (optional)
- `from` (ISO date) — start date (inclusive)
- `to` (ISO date) — end date (inclusive)
- `granularity` — `day` | `week` | `month` (default `day`)

Response:
```
{
  "data": [
    { "period": "2026-05-01", "total": 120, "passed": 110 },
    { "period": "2026-05-02", "total": 130, "passed": 125 }
  ],
  "meta": { "repo": "my-repo", "branch": "main", "granularity": "day" }
}
```

Notes:
- `period` is returned as an ISO date string (or week-start date for `week` granularity).
- Clients compute `pass %` as `passed / Math.max(1, total) * 100`.
- Use the frontend `TestResultsOverTime` component located at `src/client/components/metrics/TestResultsOverTime.tsx` to render the chart; it accepts `repo`, `branch`, `from`, `to`, and `granularity` props.
- The backend reads from pre-aggregated `TestMetric` rows when available.

Remaining work:
- Add UI controls for repo/branch/time-range, drill-down modal, CSV export, and ingestion/pre-aggregation pipeline.
