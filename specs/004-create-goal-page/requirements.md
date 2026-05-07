# Requirements: Create Goal Page

## Functional Requirements

### Requirement 1: Show Create Goal Form

The create-goal page must show a form for creating a new goal.

Acceptance criteria:

- Given a signed-in user opens `/dashboard/goals/new`, then the create-goal form is shown.
- Given an anonymous user opens `/dashboard/goals/new`, then protected content is not shown.

### Requirement 2: Support Goal Scope

The form must support team goals and individual goals.

Acceptance criteria:

- Given a user selects team goal scope, then the goal can be saved as a team goal.
- Given a user selects individual goal scope, then the goal can be saved as an individual goal.
- Given the goal is individual, then the user can optionally choose a parent team goal.

### Requirement 3: Capture Goal Details

The form must collect the data needed for dashboard tracking.

Acceptance criteria:

- Given the user creates a goal, then they can enter a title.
- Given the user creates a goal, then they can choose an owner.
- Given the user creates a goal, then they can enter current value and target value.
- Given the user creates a goal, then they can optionally enter description, unit, metric type, test category, and due date.

### Requirement 4: Validate Submission

The form must prevent invalid goals from being saved.

Acceptance criteria:

- Given required fields are missing, when the user submits the form, then validation errors are shown.
- Given target value is invalid for progress calculation, then the user sees a clear error or the goal is marked with an unavailable progress state.
- Given an individual goal references a missing parent goal, then the user sees a clear error.

### Requirement 5: Save and Return

The form must save valid goals and return users to the dashboard.

Acceptance criteria:

- Given a valid goal is submitted, then it is saved to the current data source.
- Given save succeeds, then the user returns to `/dashboard`.
- Given save fails, then the user remains on the form and sees a clear error.

## Non-Functional Requirements

- Validation should be testable outside the page component.
- The page should match the Figma visual direction.
- The form should work at common desktop and mobile widths.
