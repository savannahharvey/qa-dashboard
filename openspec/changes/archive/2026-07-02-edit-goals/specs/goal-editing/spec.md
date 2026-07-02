## ADDED Requirements

### Requirement: User can navigate to edit a goal
The system SHALL provide an Edit button on each GoalCard that navigates the user to an edit form pre-populated with the goal's current data.

#### Scenario: Edit button visible on goal card
- **WHEN** a user views the dashboard and has goals listed
- **THEN** each GoalCard SHALL display an "Edit" button or link

#### Scenario: Edit form pre-populated
- **WHEN** a user clicks the Edit button on a goal
- **THEN** the system SHALL navigate to `/goals/:id/edit` with all existing goal fields pre-filled

### Requirement: User can update goal fields
The system SHALL allow the user to modify any editable field of an existing goal (title, description, scope, owner, parent goal, metric type, test category, current value, target value, unit, due date) and save the changes.

#### Scenario: Successful update
- **WHEN** a user submits the edit form with valid data
- **THEN** the system SHALL persist the changes via `PUT /api/teams/:teamId/goals/:id` and redirect to the dashboard

#### Scenario: Validation errors shown inline
- **WHEN** a user submits the edit form with invalid data (e.g., empty title, non-numeric values)
- **THEN** the system SHALL display field-level error messages without navigating away

### Requirement: Server accepts goal update requests
The system SHALL expose a `PUT /api/teams/:teamId/goals/:id` endpoint that validates and persists updates to an existing goal.

#### Scenario: Valid update persisted
- **WHEN** a valid PUT request is received for an existing goal belonging to the team
- **THEN** the system SHALL update the goal in the database and return `200` with the updated goal JSON

#### Scenario: Goal not found
- **WHEN** a PUT request references a goal ID that does not exist or does not belong to the team
- **THEN** the system SHALL return `404`

#### Scenario: Unauthorized update attempt
- **WHEN** an unauthenticated or unauthorized request is made to the update endpoint
- **THEN** the system SHALL return `401` or `403`
