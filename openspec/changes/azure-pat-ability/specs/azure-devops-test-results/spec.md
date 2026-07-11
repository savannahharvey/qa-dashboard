## ADDED Requirements

### Requirement: Azure sync resolves the token from the team's stored PAT before the shared environment variable
The system SHALL use a team's own stored Azure DevOps PAT for that team's syncs and pipeline listings when one is configured. When a team has not configured its own PAT, the system SHALL fall back to the shared `AZURE_DEVOPS_PAT` server environment variable, preserving prior single-tenant behavior.

#### Scenario: Team has its own stored PAT
- **WHEN** Azure DevOps metrics are refreshed or pipelines are listed for a team that has a stored PAT
- **THEN** the system SHALL decrypt and use that team's stored PAT to authenticate to Azure DevOps

#### Scenario: Team has no stored PAT
- **WHEN** Azure DevOps metrics are refreshed or pipelines are listed for a team with no stored PAT
- **THEN** the system SHALL authenticate using the shared `AZURE_DEVOPS_PAT` server environment variable, if set

#### Scenario: No token is available from either source
- **WHEN** a team has no stored PAT and the shared `AZURE_DEVOPS_PAT` environment variable is unset
- **THEN** the system SHALL report a diagnostic indicating the Azure DevOps token configuration is missing, without attempting a request to Azure DevOps
