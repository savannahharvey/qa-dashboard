# Capability: team-join-code-display

## Purpose

Enables team members to view and share their team's join code from the dashboard header, and ensures the join code is surfaced immediately after team creation so the creator can note or copy it.

## Requirements

### Requirement: Dashboard header shows join code
The team dashboard header SHALL display the team's join code so members can share it with teammates at any time.

#### Scenario: Join code visible on dashboard
- **WHEN** a user views their team dashboard
- **THEN** the join code SHALL be shown in the dashboard header alongside the team name

#### Scenario: Join code copy affordance
- **WHEN** the join code is displayed
- **THEN** the user SHALL be able to copy it easily (e.g., click-to-copy button or selectable text)

### Requirement: Join code shown after team creation
The setup panel SHALL display the generated join code immediately after a team is created, before navigating to the dashboard.

#### Scenario: Join code revealed on create
- **WHEN** a user submits the "Create team" form and the team is created successfully
- **THEN** the response join code SHALL be shown in the UI so the creator can note or copy it

#### Scenario: Dismiss and continue to dashboard
- **WHEN** the join code is shown after creation
- **THEN** the user SHALL be able to dismiss and navigate to the dashboard without additional steps
