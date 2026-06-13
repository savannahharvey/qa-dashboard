Title: Test Results Over Time — Spec

Overview
--------
This spec describes the API, data model, and UI contract for displaying test-run counts and pass percentage over time.

API
---
GET /api/metrics/tests-over-time
- Query params:
  - `repo` (optional) — repository id or name
  - `branch` (optional)
  - `from` (ISO date) — start date (inclusive)
  - `to` (ISO date) — end date (inclusive)
  - `granularity` (string) — `day`|`week`|`month` (default `day`)

- Response (200):
```
{
  "data": [
    { "period": "2026-05-01", "total": 120, "passed": 110 },
    { "period": "2026-05-02", "total": 130, "passed": 125 }
  ],
  "meta": { "repo": "my-repo", "branch": "main", "granularity": "day" }
}
```

Notes
-----
- `pass %` is calculated client-side as `passed / total * 100`.
- For `week` granularity return period as the ISO week start date.
- Pagination is not required for aggregated time-series responses.

Data Model / Ingestion
----------------------
- Leverage existing test-run events in the system (CI webhook or ingestion pipeline) to increment counters.
- Suggested table for aggregated metrics (if storing pre-aggregated):
  - `test_metrics`:
    - `id` UUID
    - `repo` TEXT
    - `branch` TEXT
    - `period` DATE
    - `granularity` TEXT
    - `total` INT
    - `passed` INT
    - `created_at` TIMESTAMP

- Alternatively compute on-the-fly from `test_runs` table with GROUP BY when dataset is small.

Frontend Contract
-----------------
- Chart component expects an array of `{period, total, passed}` ordered ascending by period.
- Provide an option to toggle between absolute counts and percentages, and to export CSV.

Auth
----
- Require same auth as other metrics endpoints. Respect project/repo scoping.
