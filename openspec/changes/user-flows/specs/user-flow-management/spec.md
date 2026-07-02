## ADDED Requirements

### Requirement: Team members can create a user flow with a name and steps
The system SHALL allow authenticated team members to create a named user flow with one or more plain-text step descriptions.

#### Scenario: Flow created successfully
- **WHEN** a team member submits a new flow with a name and at least one step
- **THEN** the flow SHALL be saved to `UserFlow` for that team and keywords SHALL be auto-extracted from the step text

#### Scenario: Flow name is required
- **WHEN** a team member submits a flow without a name
- **THEN** the system SHALL reject the request with a validation error

### Requirement: Team members can edit and delete user flows
The system SHALL allow team members to update a flow's name or steps, and delete a flow entirely.

#### Scenario: Editing a flow re-extracts keywords and re-runs matching
- **WHEN** a team member saves edits to an existing flow
- **THEN** keywords SHALL be re-extracted from the updated steps and flow matching SHALL run against existing `TestRunResult` data

#### Scenario: Deleting a flow removes it and all its matches
- **WHEN** a team member deletes a user flow
- **THEN** the `UserFlow` record and all associated `UserFlowMatch` records SHALL be removed

### Requirement: User Flows page lists all team flows with coverage status
The `/dashboard/user-flows` page SHALL display all flows for the team, each with its current coverage status badge.

#### Scenario: Flow list shows coverage status per flow
- **WHEN** a team member views the User Flows page
- **THEN** each flow SHALL display a "Covered," "Partially covered," or "Not covered" badge

#### Scenario: Expanding a flow shows matched tests
- **WHEN** a team member expands a flow card
- **THEN** the flow's step list and all non-dismissed matched test names SHALL be shown

### Requirement: Team members can dismiss false-positive test matches
The system SHALL allow team members to dismiss a specific test match for a flow so it does not contribute to coverage.

#### Scenario: Dismissing a match removes it from coverage calculation
- **WHEN** a team member dismisses a test match on a flow
- **THEN** that match SHALL be marked dismissed and SHALL NOT be counted toward the flow's coverage status
