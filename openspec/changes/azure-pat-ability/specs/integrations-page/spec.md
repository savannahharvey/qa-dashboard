## ADDED Requirements

### Requirement: Azure DevOps card shows whether a PAT is configured, without displaying it
The Integrations page SHALL indicate whether a team has a stored Azure DevOps PAT and SHALL provide a way to enter, replace, or clear it, without ever rendering a previously stored token's value.

#### Scenario: A PAT is already stored
- **WHEN** a team member opens the Integrations page and the team has a stored Azure DevOps PAT
- **THEN** the Azure DevOps card SHALL show a masked "saved" indicator instead of any part of the token, along with a control to replace or clear it

#### Scenario: No PAT is stored yet
- **WHEN** a team member opens the Integrations page and the team has no stored Azure DevOps PAT
- **THEN** the Azure DevOps card SHALL show an empty PAT input prompting the team member to enter one

### Requirement: Azure DevOps card surfaces sync and connection diagnostics
The Integrations page SHALL display the diagnostic messages returned by the backend when an Azure DevOps sync or pipeline load does not succeed, instead of a generic empty state.

#### Scenario: Sync fails
- **WHEN** a team member clicks "Sync now" and the refresh response includes a diagnostic message
- **THEN** the Azure DevOps card SHALL display that diagnostic message to the team member

#### Scenario: Pipeline list fails to load
- **WHEN** pipelines are loaded or reloaded and the response includes a diagnostic message instead of pipeline data
- **THEN** the Azure DevOps card SHALL display that diagnostic message instead of a generic "No pipelines were found" message
