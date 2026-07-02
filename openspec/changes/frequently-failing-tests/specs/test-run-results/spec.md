## ADDED Requirements

### Requirement: Individual test outcomes are persisted per refresh
The system SHALL store each individual test outcome retrieved from Azure DevOps during a metrics refresh, including test name, outcome, category, and timestamp.

#### Scenario: Outcomes saved on refresh
- **WHEN** a team triggers an Azure DevOps metrics refresh
- **THEN** each individual test result (name, passed/failed/error outcome, category, run timestamp) SHALL be written to `TestRunResult` for that team

#### Scenario: Duplicate run results are ignored
- **WHEN** a refresh fetches a run ID that has already been persisted
- **THEN** the system SHALL skip re-inserting those results without error (idempotent upsert)

### Requirement: Failure rate query returns ranked test list
The system SHALL provide an endpoint that returns tests ranked by failure rate for a given team, filtered by category and lookback window.

#### Scenario: Returns tests above failure threshold
- **WHEN** `GET /api/teams/:teamId/test-failures` is called with `days=30` and `threshold=0.2`
- **THEN** the response SHALL include only tests whose `failureCount / totalRuns >= 0.2` within the last 30 days, ordered by failure rate descending

#### Scenario: Category filter applied
- **WHEN** the endpoint is called with `category=UNIT`
- **THEN** only test outcomes with `category=UNIT` SHALL be included in the aggregation

#### Scenario: Empty result when no failures exceed threshold
- **WHEN** no tests have a failure rate above the threshold in the requested window
- **THEN** the endpoint SHALL return an empty `data` array with a 200 status
