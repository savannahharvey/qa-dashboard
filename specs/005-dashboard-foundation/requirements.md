# Requirements: Dashboard Foundation

## Functional Requirements

### Requirement 1: Open Authenticated Dashboard

The application must provide a protected dashboard route for signed-in users.

Acceptance criteria:

- Given a signed-in user opens `/dashboard`, then the dashboard layout is shown.
- Given a signed-in user belongs to a team, then the dashboard shows that team's board.
- Given a user is not signed in, then protected dashboard content is not shown.

### Requirement 2: View Goals

The dashboard must display a list of team goals and individual goals.

Acceptance criteria:

- Given goals exist, when a user opens the dashboard, then each goal is visible.
- Given an individual goal supports a team goal, when a user views the dashboard, then the relationship is visible.
- Given no goals exist, when a user opens the dashboard, then an empty state is shown.

### Requirement 3: Show Progress

Each goal must show measurable progress toward its target.

Acceptance criteria:

- Given a goal has a current value of 7 and a target value of 10, then the dashboard shows 70% progress.
- Given a goal has a current value equal to or greater than its target, then the dashboard shows the goal as complete.
- Given a goal has a target value of 0 or missing target data, then the dashboard avoids dividing by zero and shows a clear unavailable state.

### Requirement 4: Show Status

Each goal must show a status that helps the team understand what needs attention.

Acceptance criteria:

- Given a goal is complete, then its status is shown as completed.
- Given a goal is incomplete and still on track, then its status is shown as active.
- Given a goal is incomplete and has a known blocker or failing metric, then its status is shown as at risk.

### Requirement 5: Show Owners

Each goal must show its owner.

Acceptance criteria:

- Given a goal has an owner, when a user views the dashboard, then the owner's username or display name is visible with the goal.
- Given a team goal has multiple supporting individual goals, when a user views the dashboard, then each individual goal owner is visible.

### Requirement 6: Show Initial QA Metrics

The dashboard must show tests passing and test coverage metrics for unit, API, and UI tests.

Acceptance criteria:

- Given unit test metrics exist, when a user views the dashboard, then unit tests passing and unit test coverage are visible.
- Given API test metrics exist, when a user views the dashboard, then API tests passing and API test coverage are visible.
- Given UI test metrics exist, when a user views the dashboard, then UI tests passing and UI test coverage are visible.
- Given a metric is unavailable, when a user views the dashboard, then the dashboard shows a clear unavailable state.

### Requirement 7: Use Sample Data First

The first version may use sample data instead of a backend.

Acceptance criteria:

- Given the application is running without a backend, then the dashboard still displays sample goals.
- Given sample data is used, then it is easy to replace with real data later.

## Non-Functional Requirements

- The dashboard should be easy to scan.
- The dashboard should follow the layout and page inventory from the Figma prototype.
- The first implementation should be small and easy to change.
- The UI should work on common desktop and mobile widths.
- Business rules for progress and status should be testable.
