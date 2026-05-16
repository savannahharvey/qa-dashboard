# Spec: Backend API Contracts

## Status

Draft

## Summary

Define the next backend API contracts needed after the read-only dashboard foundation: simple authentication, team joining, goal creation, and Azure DevOps metric refreshes. This spec turns the existing domain specs into concrete HTTP endpoints, request payloads, response shapes, authorization expectations, and verification tasks.

## Goals

- Provide simple authentication that is easy to implement and test for the class project.
- Let signed-in users join a team with a join code.
- Let signed-in team members create team and individual goals.
- Let the backend refresh Azure DevOps metrics without exposing Azure credentials to the browser.
- Keep existing read-only dashboard endpoints compatible.

## Non-Goals

- OAuth, SSO, email verification, password reset, MFA, or account recovery.
- Role-based permissions beyond signed-in team membership.
- Multi-team switching in the UI.
- Goal editing or deletion.
- A background scheduler for Azure DevOps refreshes.
- Browser access to Azure DevOps tokens or raw Azure DevOps response bodies.

## Users and Use Cases

- A new user signs up, signs in, joins the QA team, and views the dashboard.
- A returning user signs in and creates a team or individual goal.
- A signed-in team member manually refreshes Azure DevOps-sourced metrics from the dashboard or an admin-like control.
- Automated tests call the same endpoints with deterministic local data.

## Current Behavior

The backend currently exposes read-only endpoints described in `docs/decisions/0003-backend-api-architecture.md`:

- `GET /health`
- `GET /api/teams/:teamId/dashboard`
- `GET /api/teams/:teamId/test-suites`
- `GET /api/teams/:teamId/metrics`
- `GET /api/teams/:teamId/goals`

The database schema already includes `User`, `Team`, `TeamMembership`, `Goal`, `QaMetric`, and `MetricSourceConfig`, but the specs do not yet define write endpoint contracts for auth, team joining, goal creation, or Azure metric refreshes.

## Proposed Behavior

The API should use simple session authentication:

- Passwords are hashed before storage.
- Successful sign-in/sign-up creates a server-issued session.
- The session is sent to the browser as an HTTP-only cookie.
- Protected endpoints read the current user from the session cookie.
- Sign-out clears the session cookie.

The first implementation may store sessions in memory or SQLite. If sessions are stored in memory, tests and local development must treat session loss after server restart as acceptable.

## Requirements

- The API must return JSON for all success and error responses.
- Protected endpoints must return `401` when no valid session is present.
- Team-scoped endpoints must return `403` when the signed-in user does not belong to the requested team.
- Validation failures must return `400` with field-level details where practical.
- Duplicate username sign-up must return `409`.
- Missing resources must return `404`.
- Azure refresh failures must not expose Azure tokens, raw credentials, or full upstream response bodies.
- Existing read-only endpoint response shapes must remain compatible unless a later spec changes them.

## Data and API Changes

### Auth Endpoints

`POST /api/auth/sign-up`

Request:

```json
{
  "username": "sam",
  "password": "password123",
  "displayName": "Sam"
}
```

Validation:

- `username` is required, trimmed, unique, and 3 to 32 characters.
- `password` is required and at least 8 characters.
- `displayName` is optional and trimmed when provided.

Success response `201`:

```json
{
  "user": {
    "id": "user-sam",
    "username": "sam",
    "displayName": "Sam"
  }
}
```

`POST /api/auth/sign-in`

Request:

```json
{
  "username": "sam",
  "password": "password123"
}
```

Success response `200`:

```json
{
  "user": {
    "id": "user-sam",
    "username": "sam",
    "displayName": "Sam"
  },
  "teams": [
    {
      "id": "team-qa",
      "name": "QA Team"
    }
  ]
}
```

Invalid credentials response `401`:

```json
{
  "error": "Invalid username or password"
}
```

`POST /api/auth/sign-out`

Success response `204` with an empty body.

`GET /api/auth/me`

Success response `200`:

```json
{
  "user": {
    "id": "user-sam",
    "username": "sam",
    "displayName": "Sam"
  },
  "teams": [
    {
      "id": "team-qa",
      "name": "QA Team"
    }
  ]
}
```

Unauthenticated response `401`:

```json
{
  "error": "Not signed in"
}
```

### Team Membership Endpoints

`POST /api/teams/join`

Protected: yes.

Request:

```json
{
  "joinCode": "QA-TEAM"
}
```

Success response `200`:

```json
{
  "team": {
    "id": "team-qa",
    "name": "QA Team"
  }
}
```

Validation and errors:

- Missing `joinCode` returns `400`.
- Unknown `joinCode` returns `404`.
- Rejoining an existing team membership returns `200` with the team instead of creating a duplicate.

### Goal Creation Endpoint

`POST /api/teams/:teamId/goals`

Protected: yes. The signed-in user must belong to `:teamId`.

Request:

```json
{
  "title": "Keep API tests passing",
  "description": "Maintain passing API coverage for backend-facing behavior.",
  "scope": "team",
  "ownerId": "user-sam",
  "parentGoalId": null,
  "metricType": "tests-passing",
  "testCategory": "api",
  "currentValue": 1,
  "targetValue": 1,
  "unit": "state",
  "dueDate": null
}
```

Validation:

- `title` is required, trimmed, and 1 to 120 characters.
- `scope` must be `team` or `individual`.
- `ownerId` must belong to a user who is a member of the team.
- `parentGoalId` is optional for individual goals and must reference a team goal in the same team when provided.
- Team goals must not include a `parentGoalId`.
- `metricType` is optional. When provided, it must be `tests-passing` or `test-coverage`.
- `testCategory` is optional. When provided, it must be `unit`, `api`, or `ui`.
- `currentValue` and `targetValue` are required numbers.
- `targetValue` must not be `0` when progress calculation needs division.
- `dueDate` is optional. When provided, it must be an ISO date string.

Success response `201`:

```json
{
  "goal": {
    "id": "goal-generated-id",
    "teamId": "team-qa",
    "ownerId": "user-sam",
    "scope": "team",
    "parentGoalId": null,
    "title": "Keep API tests passing",
    "description": "Maintain passing API coverage for backend-facing behavior.",
    "metricType": "tests-passing",
    "testCategory": "api",
    "currentValue": 1,
    "targetValue": 1,
    "unit": "state",
    "dueDate": null,
    "status": "active",
    "createdAt": "2026-05-16T18:00:00.000Z",
    "updatedAt": "2026-05-16T18:00:00.000Z"
  }
}
```

### Azure Refresh Endpoint

`POST /api/teams/:teamId/metrics/refresh`

Protected: yes. The signed-in user must belong to `:teamId`.

Request:

```json
{
  "source": "azure-devops"
}
```

Success response `200`:

```json
{
  "source": "azure-devops",
  "refreshedAt": "2026-05-16T18:00:00.000Z",
  "metrics": [
    {
      "id": "metric-api-tests-passing",
      "teamId": "team-qa",
      "category": "api",
      "kind": "tests-passing",
      "status": "passing",
      "value": 1,
      "unit": "state",
      "source": "azure-devops",
      "measuredAt": "2026-05-16T18:00:00.000Z"
    }
  ],
  "diagnostics": []
}
```

Unavailable response behavior:

- If Azure config is missing, return `200` with unavailable metrics for configured dashboard categories and a non-secret diagnostic message.
- If Azure returns an error, return `200` with unavailable metrics and a non-secret diagnostic message.
- If the request body has an unsupported source, return `400`.

## Error Shape

General errors:

```json
{
  "error": "Human readable message"
}
```

Validation errors:

```json
{
  "error": "Validation failed",
  "fields": {
    "title": "Title is required"
  }
}
```

## Edge Cases

- A user signs up with different casing for an existing username.
- A user joins a team they already belong to.
- A signed-in user tries to create a goal for another team.
- A goal owner exists but is not a member of the target team.
- An individual goal references a parent goal in another team.
- Azure DevOps configuration exists but category mapping is ambiguous.
- Azure DevOps returns partial results for only some categories.

## Acceptance Criteria

- Given a new user submits valid sign-up data, when the API receives `POST /api/auth/sign-up`, then it creates the user, hashes the password, sets a session cookie, and returns the user without `passwordHash`.
- Given a registered user submits valid credentials, when the API receives `POST /api/auth/sign-in`, then it sets a session cookie and returns the user and teams.
- Given no valid session exists, when a protected endpoint is requested, then the API returns `401`.
- Given a signed-in user submits a valid join code, when the API receives `POST /api/teams/join`, then the user becomes a member of that team.
- Given a signed-in team member submits a valid goal, when the API receives `POST /api/teams/:teamId/goals`, then the goal is saved and returned with lowercase API enum values.
- Given a signed-in team member refreshes Azure metrics, when Azure config is valid, then normalized `QaMetric` rows are saved and returned.
- Given Azure config is missing or Azure fails, when metrics refresh is requested, then unavailable metrics are returned without exposing secrets.

## Verification

- Add API tests for sign-up, duplicate sign-up, sign-in, invalid sign-in, sign-out, and `GET /api/auth/me`.
- Add API tests for join-code success, invalid join code, and duplicate join behavior.
- Add API tests for goal creation success and validation failures.
- Add API tests for team scoping: unauthenticated users get `401`, non-members get `403`.
- Add Azure provider tests with mocked HTTP responses.
- Add API tests for Azure refresh success, missing config fallback, upstream failure fallback, and unsupported source validation.

## Assumptions

- Simple cookie-based session authentication is sufficient for the class project.
- A user may belong to multiple teams in the data model, but the first UI can use the first joined team or the selected team passed by route.
- Any signed-in team member may create goals and refresh Azure metrics in the first implementation.
- Join codes are stored on `Team.joinCode`.
- Azure DevOps PAT values are loaded from environment variables or server-side configuration only.

## Open Questions

- Should sessions be persisted in SQLite immediately, or is in-memory session storage acceptable for the first backend implementation?
- Should Azure metric refresh be manually triggered only, or should a later spec add scheduled refreshes?
