# Tasks: Azure DevOps Test Results

## Spec Tasks

- [x] Define Azure DevOps integration scope.
- [x] Identify public Azure DevOps test runs, test results, and coverage endpoints.
- [x] Define read-only auth expectations.
- [x] Define Azure outcome mapping.
- [x] Define coverage mapping.

## Implementation Tasks

- [ ] Add Azure DevOps runtime configuration.
- [ ] Add an Azure DevOps metric provider service.
- [ ] Add endpoint URL builders for test runs, test results, and coverage.
- [ ] Add result outcome normalization.
- [ ] Add coverage normalization.
- [ ] Add explicit Azure run-to-dashboard category mapping.
- [ ] Add fallback unavailable metrics for missing config, failed requests, or ambiguous run mapping.
- [ ] Connect the provider to the dashboard data-loading path after sample metrics are working.
- [ ] Keep sample metrics available for local development and demos.

## Verification Tasks

- [ ] Unit test Azure endpoint URL builders.
- [ ] Unit test Azure outcome-to-status mapping.
- [ ] Unit test Azure coverage-to-percent mapping.
- [ ] Unit test unavailable fallback behavior.
- [ ] Add an integration test with mocked Azure DevOps responses.
- [ ] Verify no token or secret appears in rendered UI, logs, or committed fixture data.
