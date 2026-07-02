## ADDED Requirements

### Requirement: Team can store a GitHub repository connection
The system SHALL allow a team to store a GitHub repository URL and optional PAT via the integrations page, persisted in `MetricSourceConfig` with `source=GITHUB`.

#### Scenario: Saving GitHub connection stores repo URL and masked PAT
- **WHEN** a user submits the GitHub form with a valid repo URL and PAT
- **THEN** the system SHALL store the repo URL and a masked PAT indicator in `MetricSourceConfig` for `source=GITHUB`

#### Scenario: PAT is never returned in full in any API response
- **WHEN** any endpoint returns GitHub integration settings
- **THEN** the PAT SHALL be represented only as a masked string (e.g., `••••••1a2b`) — the full token SHALL NOT appear in any response

### Requirement: GitHub connectivity is validated on save and on page load
The system SHALL perform a live check against the GitHub API to verify the stored credentials are valid.

#### Scenario: Live check succeeds for valid credentials
- **WHEN** a valid repo URL and PAT are saved, or the integrations page loads with stored credentials
- **THEN** the system SHALL call `GET /repos/{owner}/{repo}` and report "Connected" if it returns 200

#### Scenario: Live check fails for invalid credentials
- **WHEN** the stored PAT is expired, revoked, or the repo URL is incorrect
- **THEN** the system SHALL report an "Error" status on the integration card with a descriptive message
