## 1. Database

- [ ] 1.1 Write migration `db/migrations/add_test_run_result.sql` — create `TestRunResult` table with columns `id`, `teamId`, `runId`, `testName`, `category`, `outcome`, `ranAt`, `createdAt` and a `UNIQUE(teamId, runId, testName)` constraint
- [ ] 1.2 Add indexes on `(teamId, ranAt)` and `(teamId, category, outcome)` in the same migration

## 2. Backend — Repository

- [ ] 2.1 Add `insertTestRunResults(records[])` method to `src/db/repository.ts` using `INSERT ... ON CONFLICT DO NOTHING`
- [ ] 2.2 Add `getFrequentlyFailingTests(teamId, { category?, days, threshold, limit })` method to `src/db/repository.ts` that aggregates failure rates from `TestRunResult`

## 3. Backend — Azure DevOps Service

- [ ] 3.1 Extend `src/services/azureMetricsService.ts` refresh flow to call `insertTestRunResults` with individual test outcomes after fetching run results from Azure DevOps
- [ ] 3.2 Map Azure DevOps outcome values (`passed`, `failed`, `error`, `timeout`, `aborted`) to the stored outcome string

## 4. Backend — API Route

- [ ] 4.1 Add `GET /api/teams/:teamId/test-failures` route in `src/routes/metricsRoutes.ts` accepting `category`, `days`, `threshold`, and `limit` query params
- [ ] 4.2 Call `repository.getFrequentlyFailingTests` and return the result in `{ data: [...], meta: { days, threshold } }` shape
- [ ] 4.3 Add unit tests for `getFrequentlyFailingTests` covering empty result, threshold filtering, and category filtering

## 5. Frontend — API Client

- [ ] 5.1 Add `getTestFailures(teamId, params)` to `src/client/api.ts`

## 6. Frontend — Component

- [ ] 6.1 Create `src/client/components/FrequentlyFailingTests.tsx` with filter controls (category dropdown, days selector) and sortable table
- [ ] 6.2 Implement color-coded failure rate pill (green < 10%, yellow 10–30%, red > 30%) as a sub-component
- [ ] 6.3 Implement column sort toggle on header click (default: failure rate descending)
- [ ] 6.4 Add empty state message when no tests exceed the threshold

## 7. Frontend — Integration

- [ ] 7.1 Import and render `FrequentlyFailingTests` in the Test Results page below the existing metrics grid
- [ ] 7.2 Wire filter control changes to re-fetch `getTestFailures` with updated params

## 8. Testing

- [ ] 8.1 Unit test: `FrequentlyFailingTests` renders the empty state when `data` is empty
- [ ] 8.2 Unit test: failure rate pill renders correct color class for each severity range
- [ ] 8.3 Unit test: sorting by a column header toggles ascending/descending
- [ ] 8.4 E2E test: navigate to Test Results, verify "Frequently Failing Tests" section renders after Azure DevOps sync
