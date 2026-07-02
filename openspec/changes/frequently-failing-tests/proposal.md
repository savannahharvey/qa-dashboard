## Why

When tests fail intermittently across Azure DevOps runs, there is no way to distinguish a reliably broken test from a flaky one — both look the same in the current dashboard snapshot. Surfacing failure rate over time lets the team prioritize fixes and catch systemic problems before they mask real regressions.

## What Changes

- Persist individual test-level outcomes (pass/fail per test name) from Azure DevOps into a new `TestRunResult` table during the existing metrics refresh flow.
- Add a new API endpoint that aggregates per-test failure rates across runs, filterable by category and time window.
- Add a "Frequently Failing Tests" section to the Test Results page with a sortable, color-coded table ranked by failure rate.

## Capabilities

### New Capabilities

- `test-run-results`: Stores individual test outcomes per Azure DevOps run; provides an aggregated failure-rate query for identifying tests that fail most often.
- `frequently-failing-tests-ui`: Displays a ranked, filterable table of tests by failure rate with color-coded severity indicators on the Test Results page.

### Modified Capabilities

- `azure-devops-test-results`: Extends the existing Azure DevOps refresh flow to additionally persist individual test-level outcomes into `TestRunResult` alongside the existing aggregate metrics.

## Impact

- `src/services/azureMetricsService.ts` — extend refresh to write individual results
- `src/db/repository.ts` — new `insertTestRunResult` and `getFrequentlyFailingTests` methods
- `src/routes/metricsRoutes.ts` — new `GET /api/teams/:teamId/test-failures` endpoint
- `src/client/pages/TestResultsPage.tsx` — new section with sortable table
- `src/client/api.ts` — new `getTestFailures` call
- Database — new `TestRunResult` table (migration required)
