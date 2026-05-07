# Requirements: Dashboard Page

## Functional Requirements

### Requirement 1: Show Protected Dashboard

The dashboard page must only show protected content to signed-in users.

Acceptance criteria:

- Given a signed-in user opens `/dashboard`, then the dashboard layout and team board are shown.
- Given an anonymous user opens `/dashboard`, then protected content is not shown.

### Requirement 2: Show Team Board

The dashboard page must show team goals and supporting individual goals.

Acceptance criteria:

- Given team goals exist, then they are visible on the team board.
- Given individual goals support a team goal, then the relationship is visible.
- Given no goals exist, then an empty state is shown.

### Requirement 3: Show Goal Health

The dashboard page must show each goal's progress, status, and owner.

Acceptance criteria:

- Given a goal has progress data, then progress is displayed.
- Given a goal has a status, then the status is visually distinct.
- Given a goal has an owner, then the owner is visible.

### Requirement 4: Show QA Metrics

The dashboard page must summarize QA metric health.

Acceptance criteria:

- Given unit test metrics exist, then unit test status and coverage are visible.
- Given API test metrics exist, then API test status and coverage are visible.
- Given UI test metrics exist, then UI test status and coverage are visible.
- Given a metric is unavailable, then an unavailable state is shown.

### Requirement 5: Link to Create Goal

The dashboard page must provide a path to goal creation.

Acceptance criteria:

- Given a signed-in user is on `/dashboard`, then a create-goal action is available.
- Given the user chooses the create-goal action, then they are routed to `/dashboard/goals/new`.

## Non-Functional Requirements

- The page should be easy to scan.
- Goal and metric calculations should be testable outside the UI.
- The page should match the Figma visual direction.
- The layout should work at common desktop and mobile widths.
