# Requirements: Frontend-Backend Integration

## Functional Requirements

### Requirement 1: Session-Sync Auth

The frontend must keep its authenticated state synchronized with the backend session.

Acceptance criteria:

- Given the browser has a valid session cookie, when the app loads, then the auth provider fetches the current session from the backend.
- Given a user signs in or signs up, when the backend returns success, then the frontend stores the returned user state and enters the authenticated flow.
- Given a user signs out, when the backend returns success, then the frontend clears the authenticated state.

### Requirement 2: Live Dashboard Reads

The dashboard must render real team, goal, and QA metric data from the backend.

Acceptance criteria:

- Given a signed-in user with team membership, when the dashboard loads, then the frontend requests the live dashboard payload for the active team.
- Given database-backed team goals and QA metrics exist, when the dashboard renders, then the UI shows those records instead of placeholder content.
- Given the dashboard response is empty, when the UI renders, then it shows an empty state.

### Requirement 3: Live Mutations

The frontend must send goal, team, and metric actions through the backend and reflect the saved result.

Acceptance criteria:

- Given a user submits a valid team join code, when the join request succeeds, then the dashboard session updates to include that team.
- Given a user creates a valid goal, when the goal request succeeds, then the dashboard reflects the saved goal after refresh or reload.
- Given a user refreshes QA metrics, when the refresh request succeeds, then the dashboard reflects the new metric data after refresh or reload.

### Requirement 4: Predictable UI States

The frontend must show clear loading and error states for live backend communication.

Acceptance criteria:

- Given dashboard data is loading, when the request is still in flight, then the UI shows a loading state.
- Given the backend returns `401`, `403`, `404`, or validation errors, when the frontend performs a protected request, then the UI shows a clear error or recovery state.
- Given the backend request fails unexpectedly, when the UI cannot load live data, then it does not present stale data as current.

### Requirement 5: Automated Verification

The full-stack communication flow must be covered by automated tests.

Acceptance criteria:

- Given the auth and dashboard flows are changed, then the repository includes automated tests that exercise those browser behaviors.
- Given the frontend reads live dashboard data, then the tests verify the rendered UI against deterministic backend responses or seeded local data.
- Given a mutation changes backend state, then the tests verify the UI updates after the new state is fetched.

## Non-Functional Requirements

- The browser must use the backend API as the source of truth for authenticated data.
- Authenticated dashboard content must not depend on hardcoded sample data.
- API failures must be presented in a user-friendly way without exposing secrets or raw backend internals.
- Tests that depend on persisted data must use controlled local fixtures or an isolated test database.
- UI and browser tests must cover the authenticated flow, empty state, and error state behavior required by the constitution.
