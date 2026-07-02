## MODIFIED Requirements

### Requirement: Metrics refresh triggers user flow matching
The Azure DevOps metrics refresh SHALL, after persisting individual test outcomes to `TestRunResult`, also trigger keyword matching for all user flows belonging to the team.

#### Scenario: User flow matching runs after each refresh
- **WHEN** an Azure DevOps metrics refresh completes and the team has at least one user flow defined
- **THEN** the system SHALL call the user flow matching service to update `UserFlowMatch` records for the team

#### Scenario: Refresh continues normally when no user flows exist
- **WHEN** an Azure DevOps metrics refresh completes and the team has no user flows
- **THEN** the system SHALL complete the refresh successfully without errors (matching is a no-op)
