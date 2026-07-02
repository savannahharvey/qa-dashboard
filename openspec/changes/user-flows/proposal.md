## Why

Test suites often grow organically without any connection to what users actually need the product to do. A team can have high test counts and good coverage percentages but still ship a broken sign-up flow because no test ever verified that specific path end-to-end. Defining user flows explicitly and automatically checking whether tests cover them closes this gap — it connects what the product does to what the tests verify.

## What Changes

- Add a User Flows management page at `/dashboard/user-flows` where teams can define, edit, and delete named user flows with step descriptions.
- After each Azure DevOps sync, run keyword matching between flow step text and Azure DevOps test names to detect which flows have test coverage.
- Add a User Flow Coverage panel to the Analytics page showing covered / partially covered / not covered flow counts and a coverage score.
- Allow dismissing false-positive test matches per flow.

## Capabilities

### New Capabilities

- `user-flow-management`: CRUD operations for team-scoped user flow records (name + steps), stored in a new `UserFlow` table.
- `user-flow-coverage`: Keyword-matching engine that maps Azure DevOps test names to user flows after each sync; stores matches in `UserFlowMatch`; computes a per-flow coverage status and an overall coverage score for the analytics panel.

### Modified Capabilities

- `azure-devops-test-results`: After each metrics refresh, the system SHALL also run user flow matching against the newly persisted `TestRunResult` data.

## Impact

- Database — new `UserFlow` and `UserFlowMatch` tables (migration required)
- `src/routes/userFlowRoutes.ts` — new CRUD routes + dismiss-match route
- `src/services/userFlowMatchingService.ts` — keyword extraction and matching engine
- `src/services/azureMetricsService.ts` — trigger flow matching after refresh
- `src/services/analyticsService.ts` — add `computeUserFlowCoverage(teamId)` panel
- `src/client/pages/UserFlowsPage.tsx` — new page
- `src/client/components/analytics/UserFlowCoveragePanel.tsx` — new analytics panel
- `src/client/App.tsx` — new `/dashboard/user-flows` route
