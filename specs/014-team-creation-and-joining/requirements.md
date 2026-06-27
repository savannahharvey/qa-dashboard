# Requirements: Team Creation and Joining

## Functional Requirements

### Requirement 1: Show Team Setup When No Team Exists

The app must show a team setup experience for signed-in users who do not yet have an active team.

Acceptance criteria:

- Given a signed-in user has no team membership, when they open the authenticated area, then they see options to create a team or join a team.
- Given a signed-in user already has a team, when they open the authenticated area, then they are taken to the team dashboard instead of the setup screen.

### Requirement 2: Create a Team

The app must let a signed-in user create a new team.

Acceptance criteria:

- Given a user enters a valid team name and submits the create-team form, then a new team is created.
- Given a team is created successfully, then the creator is added as a member of that team.
- Given creation succeeds, then the user is routed into the dashboard for the new team.

### Requirement 3: Join an Existing Team

The app must keep the existing join-team flow available.

Acceptance criteria:

- Given a user enters a valid join code, then the user is added to the matching team.
- Given joining succeeds, then the user is routed into the dashboard for that team.
- Given the join code is invalid, then the user sees a clear error message.

### Requirement 4: Validate Team Setup Input

The team setup forms must prevent invalid submissions.

Acceptance criteria:

- Given the team name is blank, then the create-team form shows a validation error.
- Given the join code is blank or malformed, then the join-team form shows a validation error.
- Given the backend rejects the request, then the user sees a clear message and remains on the setup screen.

### Requirement 5: Keep Auth State in Sync

The authenticated session must reflect the newly created or joined team.

Acceptance criteria:

- Given team creation succeeds, then the current session includes the new team.
- Given joining succeeds, then the current session includes the joined team.
- Given the session is reloaded after create or join, then the dashboard uses the current team membership data.

### Requirement 6: Return to Team Setup From the Dashboard

The dashboard must provide a way to return to the team setup screen.

Acceptance criteria:

- Given a signed-in user is viewing the dashboard, then they can choose an action that takes them back to the team setup screen.
- Given the user returns to team setup, then they can create a team or join a team from that screen.
- Given the user leaves the dashboard for team setup, then their session remains signed in.

## Non-Functional Requirements

- The setup flow should be usable at common desktop and mobile widths.
- Validation should be testable independently from the page component.
- The create-team and join-team flows should have predictable error handling for automated tests.
