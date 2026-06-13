Title: Test Results Over Time — Implementation Tasks

Backend
-------
- [ ] Add API route `GET /api/metrics/tests-over-time` that accepts repo/branch/from/to/granularity.
- [ ] Implement DB query or aggregated table reads for requested range and granularity.
- [ ] Add tests for aggregation correctness and edge cases (zero totals, missing days).
- [ ] Add migration if introducing `test_metrics` table for pre-aggregation.

Ingestion
---------
- [ ] Pipe CI/test-run events into the metrics pipeline (webhook consumer or batch job).
- [ ] Implement pre-aggregation job (optional) to populate `test_metrics` daily.

Frontend
--------
- [ ] Create `TestResultsOverTime` component under `src/client/components/metrics`.
- [ ] Use a chart library (e.g., Chart.js, Recharts, or ApexCharts) to render lines for total/passed and area for pass %.
- [ ] Add repository/branch selector and time-range control.
- [ ] Add drill-down modal to show runs for a selected date.
- [ ] Add export CSV button and table view fallback.

Testing & QA
-----------
- [ ] Unit tests for API and frontend components.
- [ ] E2E test to verify filtering, granularity switching, and drill-down.

Documentation
-------------
- [ ] Add updated README and a short entry in docs/ explaining endpoint and frontend usage.
