## MODIFIED Requirements

### Requirement: Metrics refresh persists individual test outcomes
The Azure DevOps metrics refresh SHALL, in addition to updating aggregate `QaMetric` records, persist each individual test outcome to `TestRunResult` for the team.

#### Scenario: Refresh writes both aggregate and individual records
- **WHEN** a team triggers a metrics refresh and Azure DevOps returns test run results
- **THEN** the system SHALL update `QaMetric` aggregate records as before AND write individual `TestRunResult` rows for each test in each fetched run

#### Scenario: Refresh is idempotent for already-persisted runs
- **WHEN** a refresh fetches a run ID whose results are already in `TestRunResult`
- **THEN** the system SHALL not create duplicate rows (use ON CONFLICT DO NOTHING)
