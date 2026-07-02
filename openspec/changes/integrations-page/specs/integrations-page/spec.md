## ADDED Requirements

### Requirement: Integrations page is accessible from dashboard navigation
The dashboard navigation SHALL include an "Integrations" link that navigates to `/dashboard/integrations`.

#### Scenario: Nav link present and functional
- **WHEN** a logged-in team member views the dashboard
- **THEN** the navigation SHALL include an "Integrations" link that opens `/dashboard/integrations`

### Requirement: Integrations page shows a card per integration
The integrations page SHALL display one card each for Azure DevOps and GitHub, showing connection status and summary information.

#### Scenario: Connected integration shows status and summary
- **WHEN** an integration has credentials stored and the live check succeeds
- **THEN** the card SHALL show a green "Connected" badge and a summary of the connection (e.g., org/project for Azure DevOps, repo URL for GitHub)

#### Scenario: Disconnected integration shows inactive state
- **WHEN** no credentials are stored for an integration
- **THEN** the card SHALL show a grey "Not connected" badge and a "Connect" button

#### Scenario: Failed status check shows error state
- **WHEN** credentials are stored but the live connectivity check fails (invalid PAT, deleted project, etc.)
- **THEN** the card SHALL show a red "Error" badge and an error message

### Requirement: User can configure or update an integration
Each integration card SHALL provide a "Configure" action that opens a form for entering or updating credentials.

#### Scenario: Configure form pre-fills existing values
- **WHEN** the user opens the configure form for a connected integration
- **THEN** non-sensitive fields (organization, project, repo URL) SHALL be pre-filled and the PAT field SHALL show only the masked indicator

#### Scenario: Saving configuration updates stored settings
- **WHEN** the user submits the configuration form with valid credentials
- **THEN** the system SHALL store the new settings, run a live check, and update the card's status badge

### Requirement: User can disconnect an integration
Each connected integration card SHALL provide a "Disconnect" action that clears credentials.

#### Scenario: Disconnect clears credentials and resets status
- **WHEN** the user confirms the disconnect action
- **THEN** credentials SHALL be removed from `MetricSourceConfig`, the integration SHALL be disabled, and the card SHALL show the "Not connected" state

#### Scenario: Disconnect does not delete metric data
- **WHEN** an integration is disconnected
- **THEN** existing `QaMetric` records sourced from that integration SHALL remain in the database
