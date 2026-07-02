## ADDED Requirements

### Requirement: Analytics page is accessible from dashboard navigation
The dashboard navigation SHALL include an "Analytics" link navigating to `/dashboard/analytics`.

#### Scenario: Nav link present and functional
- **WHEN** a logged-in team member views the dashboard
- **THEN** the navigation SHALL include an "Analytics" link that opens `/dashboard/analytics`

### Requirement: Analytics page displays an overall QA Health Score
The analytics page SHALL display a QA Health Score (0–100) computed as a weighted average of available panel scores.

#### Scenario: Score computed from available panels only
- **WHEN** the analytics page loads and one or more panels are unavailable
- **THEN** the health score SHALL be computed using only the available panels (unavailable panels excluded from denominator)

#### Scenario: Score color reflects health level
- **WHEN** the health score is displayed
- **THEN** it SHALL be green for scores ≥ 75, yellow for 50–74, and red for scores < 50

### Requirement: Analytics page shows a grid of insight panels
The analytics page SHALL render four insight panels: test type balance, CI/CD velocity, user flow coverage, and quality principles.

#### Scenario: Panel shows data when integration is available
- **WHEN** a panel's required data source is connected and populated
- **THEN** the panel SHALL display its score, visualization, and recommendation

#### Scenario: Panel shows unavailable state when data source is missing
- **WHEN** a panel requires an integration that is not connected (e.g., GitHub for CI/CD velocity) or data that has not been defined (e.g., no user flows)
- **THEN** the panel SHALL display a grey unavailable state with a specific message explaining what is needed

### Requirement: Analytics page shows last-refreshed timestamp and a refresh action
The analytics page SHALL show when the underlying data was last synced and allow the user to trigger a new sync.

#### Scenario: Last-refreshed timestamp is visible
- **WHEN** the analytics page loads
- **THEN** a "Last refreshed: <relative time>" label SHALL be shown near the top of the page

#### Scenario: Refresh button triggers a new Azure DevOps sync
- **WHEN** the user clicks the "Refresh" button
- **THEN** the system SHALL trigger a metrics refresh for the team and reload the analytics data when complete
