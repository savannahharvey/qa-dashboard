# Design: Frontend-Backend Integration

## Architecture Fit

This spec keeps the existing React frontend, Express backend, and PostgreSQL data flow intact. The frontend remains a thin browser client that talks to `/api` through the existing `src/client/api.ts` boundary.

Relevant existing modules:

- `src/client/api.ts`
- `src/client/state/AuthContext.tsx`
- `src/client/pages/DashboardPage.tsx`
- `src/client/pages/CreateGoalPage.tsx`
- `src/client/pages/SignInPage.tsx`
- `src/client/pages/SignUpPage.tsx`
- `src/client/pages/HomePage.tsx`
- `src/routes/*`
- `src/services/*`
- `src/db/*`

## Data Flow

1. The auth provider loads `/api/auth/me` on startup.
2. The frontend stores the authenticated user and team list in React state.
3. The dashboard selects the active team from that session state.
4. The dashboard fetches `/api/teams/:teamId/dashboard`.
5. Goal creation and metric refresh submit to the backend and then trigger a dashboard reload.

This keeps the browser dependent on the server for current data and avoids duplicating business rules in the client.

## UI Behavior

Authenticated screens should behave as live views:

- `DashboardPage` should show loading, empty, and error states while the dashboard request is in progress.
- `JoinTeamPanel` should update the session after a successful join.
- `CreateGoalPage` should reload or navigate in a way that reveals the newly saved goal state.
- `HomePage` can remain mostly static, but any authenticated entry point must rely on the live session and dashboard responses.

The app should not fall back to hardcoded dashboard content once the authenticated session exists.

## Mutation And Refresh Strategy

The simplest reliable strategy is explicit refetching after each successful write:

- After sign-in, sign-up, or join-team success, refresh the current session.
- After goal creation, return to the dashboard and refetch the current team dashboard.
- After metric refresh, refetch the current team dashboard so the latest persisted metrics are visible.

This avoids stale optimistic UI logic and keeps the frontend aligned with the backend contract.

## Error Handling

The frontend API layer should continue to normalize backend failures into `ApiError` instances with:

- HTTP status
- top-level error message
- optional field map for validation issues

The UI should map these errors to form messages or page-level banners without exposing backend internals.

Recommended handling:

- `401`: clear the session and send the user back to the sign-in path.
- `403`: show an access-denied message for protected team data.
- `404`: show a not-found or invalid-team message.
- `400`: surface field-level validation errors where available.

## Test Strategy

The spec should be proved at two layers:

- Component and page tests for loading, error, and empty states.
- Browser or integration tests for the real flow from sign-in to dashboard render against deterministic backend data.

The integration tests should use controlled local data so they verify the UI against known database records rather than live external services.

## Risks And Tradeoffs

- The frontend currently has several page-level fetches. If they are not coordinated after mutations, the UI can drift from the persisted backend state.
- If the active team selection is implicit, users with more than one team may see the first team by default until team switching is added.
- Overly aggressive optimistic updates would make the UI feel faster but could hide backend failures; explicit refetching is safer for this stage.

## Migration Impact

No database migration is expected for this spec. The change is in browser-to-API integration and verification, not in schema shape.
