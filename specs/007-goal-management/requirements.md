# Requirements: Goal Management

## Functional Requirements

### Requirement 1: Team Goals

The system must support team-level goals.

Acceptance criteria:

- Given a team goal exists, when a team member views the dashboard, then the team goal is visible.
- Given a team goal has an owner, when it is displayed, then the owner is visible.

### Requirement 2: Individual Goals

The system must support individual goals owned by team members.

Acceptance criteria:

- Given an individual goal exists, when a team member views the dashboard, then the individual goal is visible.
- Given an individual goal has an owner, when it is displayed, then the owner is visible.

### Requirement 3: Link Individual Goals to Team Goals

Individual goals must be able to support a team goal.

Acceptance criteria:

- Given an individual goal supports a team goal, when the dashboard displays the team goal, then the supporting individual goal relationship is visible.
- Given a team goal has multiple supporting individual goals, then the dashboard can show each relationship.

### Requirement 4: Optional Dates

Dates must be optional for goals.

Acceptance criteria:

- Given a goal has no due date, when it is displayed, then it still appears normally.
- Given a goal has a due date, when it is displayed, then the date may be shown.
- Given a goal has no due date, then status calculation does not require one.

### Requirement 5: Create Goal

Signed-in users must be able to create a new goal.

Acceptance criteria:

- Given a signed-in user opens the create-goal view, then they can enter the goal title, scope, owner, metric, current value, target value, and optional due date.
- Given the new goal is an individual goal, then the user can optionally link it to a team goal.
- Given required fields are missing, when the user submits the form, then they see clear validation errors.
- Given a valid goal is submitted, then the goal is saved and can appear on the team board.

## Non-Functional Requirements

- Goal data should be structured so it can support future editing.
- Goal relationships should be easy to query by team and owner.
