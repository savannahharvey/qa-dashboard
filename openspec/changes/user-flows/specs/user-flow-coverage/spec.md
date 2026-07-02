## ADDED Requirements

### Requirement: Keyword matching runs against TestRunResult after each Azure DevOps sync
After an Azure DevOps metrics refresh, the system SHALL re-run keyword matching for all user flows belonging to the team against the team's `TestRunResult` test names.

#### Scenario: Matching runs automatically post-sync
- **WHEN** an Azure DevOps metrics refresh completes for a team
- **THEN** the system SHALL call the user flow matching service with that team's flows and the latest `TestRunResult` test names

#### Scenario: Previously dismissed matches are preserved during re-match
- **WHEN** matching re-runs and a test name already has a dismissed `UserFlowMatch` row
- **THEN** the dismissed flag SHALL remain true (not overwritten by the re-match)

### Requirement: Coverage status is computed per flow
The system SHALL assign each user flow a coverage status based on the number and quality of non-dismissed matches.

#### Scenario: Flow marked "Covered" when keyword ratio meets threshold
- **WHEN** a flow has at least one non-dismissed match AND the ratio of matched keywords to total flow keywords is ≥ 0.5
- **THEN** the flow status SHALL be "covered"

#### Scenario: Flow marked "Partially covered" when matches exist below threshold
- **WHEN** a flow has at least one non-dismissed match but keyword ratio is < 0.5
- **THEN** the flow status SHALL be "partially covered"

#### Scenario: Flow marked "Not covered" when no matches exist
- **WHEN** a flow has zero non-dismissed matches
- **THEN** the flow status SHALL be "not covered"

### Requirement: Analytics panel shows user flow coverage summary
The user flow coverage analytics panel SHALL show overall coverage counts and a score derived from flow coverage statuses.

#### Scenario: Panel shows covered / partial / not covered counts
- **WHEN** the analytics panel loads and user flows exist
- **THEN** the panel SHALL display the count of flows in each coverage status

#### Scenario: Panel score reflects weighted coverage
- **WHEN** the panel score is computed
- **THEN** it SHALL equal `(covered × 1.0 + partial × 0.5) / total × 100`, rounded to the nearest integer

#### Scenario: Panel shows empty state when no flows are defined
- **WHEN** the team has no user flows
- **THEN** the panel SHALL show "No user flows defined yet" with a link to `/dashboard/user-flows`
