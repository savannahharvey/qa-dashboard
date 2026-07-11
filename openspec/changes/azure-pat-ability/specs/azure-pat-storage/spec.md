## ADDED Requirements

### Requirement: Team can store an encrypted Azure DevOps PAT
The system SHALL allow a team member to submit an Azure DevOps Personal Access Token through the Integrations page, and SHALL encrypt it before persisting it. The system SHALL NOT persist the token in plaintext anywhere, including logs.

#### Scenario: Team submits a PAT
- **WHEN** a team member enters an Azure DevOps PAT on the Integrations page and saves Azure DevOps settings
- **THEN** the token SHALL be encrypted server-side and stored against that team's Azure DevOps metric source configuration

#### Scenario: Stored PAT is encrypted at rest
- **WHEN** a team's Azure DevOps PAT is persisted
- **THEN** the database column SHALL contain only ciphertext, never the plaintext token

### Requirement: PAT is never returned to the client in plaintext
The system SHALL NOT include token material in any API response. Clients SHALL only be able to determine whether a PAT is configured, not its value.

#### Scenario: Fetching Azure DevOps config after saving a PAT
- **WHEN** a client requests the team's Azure DevOps metric source configuration
- **THEN** the response SHALL include a boolean indicating whether a PAT is on file and SHALL NOT include the token itself in any form

### Requirement: Team can replace or clear a stored PAT
The system SHALL allow a team member to overwrite a previously stored PAT with a new one, and to remove a stored PAT entirely.

#### Scenario: Replacing an existing PAT
- **WHEN** a team member submits a new PAT for a team that already has one stored
- **THEN** the system SHALL discard the previous encrypted value and store the new one encrypted

#### Scenario: Clearing a stored PAT
- **WHEN** a team member submits an empty PAT value while saving Azure DevOps settings
- **THEN** the system SHALL remove the stored encrypted token for that team
