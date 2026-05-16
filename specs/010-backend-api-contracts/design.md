# Design: Backend API Contracts

## API Style

Use REST-style JSON endpoints under `/api`. Keep request and response shapes small, explicit, and friendly to frontend form handling.

Existing read-only endpoints stay in place:

- `GET /api/teams/:teamId/dashboard`
- `GET /api/teams/:teamId/test-suites`
- `GET /api/teams/:teamId/metrics`
- `GET /api/teams/:teamId/goals`

New write and session endpoints:

- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
- `GET /api/auth/me`
- `POST /api/teams/join`
- `POST /api/teams/:teamId/goals`
- `POST /api/teams/:teamId/metrics/refresh`

## Simple Auth Design

Use username/password auth with an HTTP-only session cookie.

Recommended session cookie behavior:

- Name: `qa_dashboard_session`.
- `HttpOnly`: true.
- `SameSite`: `lax`.
- `Secure`: false in local development, true in production.
- Path: `/`.

The first implementation can store session records in SQLite or memory. SQLite is more durable and easier to inspect, but memory is acceptable for a simple class-project implementation if tests account for it.

Public user responses must include only:

```ts
type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
};
```

## Authorization

Auth middleware should resolve the current user from the session cookie.

Team membership middleware should:

1. Require a signed-in user.
2. Check `TeamMembership` for `userId` and `teamId`.
3. Return `401` for missing/invalid sessions.
4. Return `403` for valid users who are not team members.

For the first implementation, any signed-in team member can create goals and refresh Azure metrics.

## Endpoint Details

### Auth

`POST /api/auth/sign-up` creates a user, hashes the password, starts a session, and returns public user data.

`POST /api/auth/sign-in` verifies credentials, starts a session, and returns public user data plus team memberships.

`POST /api/auth/sign-out` clears the session and returns `204`.

`GET /api/auth/me` returns the current signed-in user and team memberships.

### Team Joining

`POST /api/teams/join` accepts a `joinCode`, finds the matching team, creates a `TeamMembership` if needed, and returns public team data.

This endpoint is not team-scoped because the user does not know `teamId` before joining.

### Goal Creation

`POST /api/teams/:teamId/goals` accepts lowercase API enum values and stores the strict uppercase database values already used by the domain types.

API values:

- Goal scope: `team`, `individual`.
- Goal status response: `active`, `completed`, `at-risk`.
- Metric type: `tests-passing`, `test-coverage`.
- Test category: `unit`, `api`, `ui`.

The service layer should validate ownership, parent-goal relationships, metric values, and enum mapping before inserting the row.

### Azure Refresh

`POST /api/teams/:teamId/metrics/refresh` calls the metric provider boundary described in `specs/009-azure-devops-test-results/design.md`.

The endpoint should:

1. Require team membership.
2. Accept `{ "source": "azure-devops" }`.
3. Load Azure configuration server-side.
4. Fetch or synthesize normalized metrics.
5. Upsert or replace current Azure-sourced `QaMetric` rows for the team.
6. Return normalized metrics and non-secret diagnostics.

If Azure configuration is missing or Azure requests fail, return `200` with unavailable metrics so the dashboard can render a stable state.

## Validation and Error Design

Use this shape for validation errors:

```ts
type ValidationErrorResponse = {
  error: "Validation failed";
  fields: Record<string, string>;
};
```

Use this shape for general errors:

```ts
type ErrorResponse = {
  error: string;
};
```

Recommended status codes:

- `200` for successful reads, sign-in, team join, and Azure refresh.
- `201` for sign-up and goal creation.
- `204` for sign-out.
- `400` for validation errors.
- `401` for unauthenticated requests.
- `403` for authenticated users without team access.
- `404` for missing teams, join codes, goals, or other resources.
- `409` for duplicate usernames.

## Testing Notes

- Use API tests for endpoint contracts and status codes.
- Use service tests for validation and enum mapping.
- Mock Azure HTTP calls and never call live Azure DevOps from tests.
- Add negative tests for team scoping before wiring protected frontend routes.
