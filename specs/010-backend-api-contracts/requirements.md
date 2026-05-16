# Requirements: Backend API Contracts

## Functional Requirements

### Requirement 1: Simple Authentication

The API must support username/password sign-up, sign-in, sign-out, and current-user lookup.

Acceptance criteria:

- Given valid new account information, when a user signs up, then the API creates the user, hashes the password, signs the user in, and returns public user data.
- Given a duplicate username, when a user signs up, then the API returns a conflict error.
- Given valid credentials, when a user signs in, then the API creates a session and returns public user data with team memberships.
- Given invalid credentials, when a user signs in, then the API returns an authentication error without revealing which field was wrong.
- Given a signed-in user, when the user signs out, then the API clears the session.
- Given a signed-in user, when the client requests the current user, then the API returns public user data and teams.

### Requirement 2: Team Joining

The API must let signed-in users join a team with a join code.

Acceptance criteria:

- Given a valid join code, when a signed-in user joins a team, then a team membership exists.
- Given an invalid join code, when a signed-in user joins a team, then the API returns a clear error.
- Given the user already belongs to the team, when the user submits the same join code, then the API returns success without duplicate membership.

### Requirement 3: Protected Team Scope

The API must protect team-scoped data by signed-in membership.

Acceptance criteria:

- Given no valid session, when a protected endpoint is requested, then the API returns `401`.
- Given a signed-in user who does not belong to a team, when that user requests the team's protected data, then the API returns `403`.
- Given a signed-in team member, when that user requests the team's protected data, then the request is allowed.

### Requirement 4: Goal Creation

The API must let signed-in team members create team and individual goals.

Acceptance criteria:

- Given valid team-goal data, when a team member creates a goal, then the goal is saved and returned.
- Given valid individual-goal data with a parent team goal, when a team member creates a goal, then the parent relationship is saved.
- Given required fields are missing or invalid, when a team member creates a goal, then the API returns field-level validation errors.
- Given the owner is not a member of the team, when a team member creates a goal, then the API rejects the request.
- Given a parent goal belongs to another team, when a team member creates an individual goal, then the API rejects the request.

### Requirement 5: Azure DevOps Metric Refresh

The API must let signed-in team members refresh Azure DevOps-sourced QA metrics through the backend.

Acceptance criteria:

- Given Azure DevOps configuration is valid, when metrics refresh is requested, then the backend fetches Azure data, normalizes it, saves metrics, and returns normalized metrics.
- Given Azure DevOps configuration is missing, when metrics refresh is requested, then the backend returns unavailable metrics and diagnostics without failing the dashboard.
- Given Azure DevOps returns an error, when metrics refresh is requested, then the backend returns unavailable metrics and diagnostics without exposing secrets.
- Given an unsupported source is requested, when metrics refresh is requested, then the API returns a validation error.

## Non-Functional Requirements

- Password hashes and session secrets must not be returned in API responses.
- Azure tokens must never be returned to the browser or written to committed fixtures.
- Error responses should be predictable enough for frontend forms and tests.
- Endpoint behavior should be covered with API tests.
- Existing read-only dashboard responses should remain compatible.
