## Context

The current Azure DevOps integration fetches test runs and stores only aggregate pass/fail counts per category (UNIT/API/UI) in `QaMetric`. Individual test-level outcomes are discarded after each refresh, making it impossible to track which specific tests fail repeatedly over time. The `azureMetricsService.ts` already fetches individual test results from `/_apis/test/runs/{runId}/results` — the data is available but not persisted.

## Goals / Non-Goals

**Goals:**
- Persist individual test outcomes (test name, outcome, run timestamp) during the existing refresh flow.
- Provide a failure-rate aggregation query scoped to a team, category, and time window.
- Surface the top failing tests in the Test Results page UI with filtering and sorting.

**Non-Goals:**
- Real-time test result streaming (batch refresh only, same as today).
- Storing test output/logs/stack traces — name and outcome only.
- Cross-team comparison of test failure rates.

## Decisions

**Store individual outcomes in a new `TestRunResult` table rather than recomputing from run-level data.**
The current `QaMetric` table stores aggregated snapshots, not individual test records. Adding a separate table keeps concerns separated and avoids retrofitting a schema that wasn't designed for per-test rows. Alternative considered: extend `QaMetric` with test name — rejected because it would bloat a table designed for category-level metrics and break existing queries.

**Compute failure rate on read (query-time aggregation) rather than storing a pre-computed rate.**
Run counts are small per team, and query-time aggregation over `TestRunResult` with a date-range index is fast enough. Pre-computing rates would require incremental update logic when historical records are backfilled. Trade-off: slightly higher read latency, but simpler write path.

**Add the UI as a new section on the existing Test Results page rather than a dedicated page.**
Frequently failing tests are a diagnostic view that pairs naturally with the existing results summary. A separate page adds navigation overhead for what is a supporting detail. If the feature grows (e.g., flakiness trend charts per test), it can be promoted to its own page later.

## Risks / Trade-offs

- **Volume risk**: Azure DevOps runs can have hundreds of tests per run. Over many refreshes this table grows large. → Mitigation: add a retention policy (delete records older than 90 days) and an index on `(teamId, ranAt)`.
- **Duplicate inserts on re-refresh**: If a team refreshes twice for the same run, results could be duplicated. → Mitigation: use `UNIQUE(teamId, runId, testName)` and `INSERT ... ON CONFLICT DO NOTHING`.
- **Test name instability**: Test names that change between refactors will appear as different tests, breaking continuity. → Accepted limitation for MVP; no mitigation needed now.

## Migration Plan

1. Add migration `db/migrations/add_test_run_result.sql` creating the `TestRunResult` table.
2. Deploy backend changes (additive — no existing queries affected).
3. The table is empty until the next Azure DevOps refresh; no backfill needed.
4. Rollback: drop the table; remove the new endpoint and ingestion code.
