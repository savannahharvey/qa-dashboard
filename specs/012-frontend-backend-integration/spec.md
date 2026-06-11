# Spec: Frontend-Backend Integration

## Status

Draft

## Summary

Integrate the React frontend with the backend API so authenticated screens render live team, goal, and QA metric data from the database instead of static or sample-only content. This spec defines the expected full-stack communication flow for auth, team membership, dashboard reads, goal creation, and metric refreshes.

## Goals

- Make the browser use the real backend API for session, team, goal, and metric data.
- Render the authenticated dashboard from live database-backed responses.
- Keep sign-in, sign-up, team join, goal creation, and metric refresh flows working end to end.
- Show loading, empty, and error states that reflect actual API outcomes.
- Verify the browser-to-API flow with automated tests.

## Non-Goals

- New backend endpoints or changes to the API contract defined in `specs/010-backend-api-contracts/`.
- A redesign of the public marketing pages.
- Offline support, client-side caching, or websocket-based live updates.
- Multi-team switching or new permission roles.
- Changing the database schema.

## Users and Use Cases

- A new user signs up, signs in, joins the class team, and lands on a dashboard populated from the database.
- A returning user signs in and sees the current team, goals, and QA metrics for the signed-in session.
- A team member creates a goal and immediately sees the updated dashboard data after the backend saves it.
- A team member refreshes QA metrics and sees the dashboard reflect the newly stored values.

## Current Behavior

The frontend already has an API helper layer and auth context, and the dashboard page already requests `/api/teams/:teamId/dashboard`. The sign-in, sign-up, team join, goal creation, and metric refresh pages are also wired to backend endpoints.

What is still missing is an explicit product-level contract for the live-data flow and the automated UI coverage that proves the browser is using real backend responses and database state instead of static assumptions.

## Proposed Behavior

The frontend should treat the backend API as the source of truth for authenticated data:

- The auth provider loads the current session from `/api/auth/me` and keeps the browser state in sync with the session cookie.
- Sign-in and sign-up update the current session and immediately move the user into the authenticated experience.
- The dashboard reads the current team from the authenticated session and fetches live dashboard data from the backend.
- Goal creation and metric refresh are submitted through the backend and then reflected in the UI by reloading the relevant dashboard data.
- When no team exists in the session, the dashboard should show the join flow instead of fake or stale data.
- When a request fails, the UI should show a predictable error state rather than silently continuing with stale content.

## Acceptance Criteria

- Given a user has a valid session cookie, when the frontend loads, then it fetches `/api/auth/me` and renders the authenticated state from the response.
- Given a signed-in user has a team membership, when the dashboard opens, then it fetches live dashboard data from `/api/teams/:teamId/dashboard` and renders the team, goals, and QA metrics from the database.
- Given a signed-in user joins a team, creates a goal, or refreshes metrics, when the backend request succeeds, then the relevant UI updates to reflect the saved database state.
- Given the backend returns `401`, when the frontend requests protected data, then the UI clears or rejects the session and prompts the user to sign in again.
- Given the backend returns `403`, validation errors, or a missing-resource error, when the user performs a protected action, then the UI shows a clear error message and does not pretend the action succeeded.
- Given the dashboard has no goals or metrics, when the data response is empty, then the UI shows an empty state instead of placeholder test data.
- Given the frontend is exercised by automated tests, then the tests cover authenticated loading, dashboard rendering from live data, mutation refresh behavior, and error states.

## Verification

- Add frontend tests for auth session loading, sign-in, sign-up, and sign-out flow behavior.
- Add frontend tests for the dashboard loading state, empty state, and successful rendering from mocked live API responses.
- Add integration coverage that proves goal creation and metric refresh update the dashboard state after the backend responds.
- Add browser or component tests for `401`, `403`, and validation error handling.
- Verify the UI does not rely on hardcoded authenticated dashboard content for its primary data path.

## Assumptions

- The backend contracts in `specs/010-backend-api-contracts/` are the source of truth for request and response shapes.
- The authenticated dashboard uses the first team in the current session until a separate multi-team selection feature exists.
- Same-origin API requests with `credentials: "include"` remain the preferred browser transport.

## Open Questions

- Should the public home page keep its illustrative preview cards, or should those also be sourced from live data after login?
- Should dashboard data reload automatically after every mutation, or only after explicit user actions that change the team state?
