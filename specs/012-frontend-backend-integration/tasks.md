# Tasks: Frontend-Backend Integration

## Spec Tasks

- [x] Define the full-stack communication flow for auth, dashboard reads, and live mutations.
- [x] Define loading, empty, and error state expectations for authenticated screens.
- [x] Define the verification approach for browser-to-API behavior.

## Implementation Tasks

- [ ] Ensure the auth provider always hydrates the current session from `/api/auth/me`.
- [ ] Ensure sign-in, sign-up, sign-out, and join-team flows update the authenticated UI state from backend responses.
- [ ] Ensure the dashboard always fetches live team, goal, test-suite, and metric data from the backend.
- [ ] Ensure goal creation and metric refresh trigger a dashboard refresh so the UI reflects persisted state.
- [ ] Ensure protected-request failures render clear recovery states instead of stale dashboard content.
- [ ] Remove any reliance on hardcoded authenticated dashboard data paths.

## Verification Tasks

- [ ] Add UI or component tests for authenticated session loading and sign-in/sign-up state transitions.
- [ ] Add UI or component tests for dashboard loading, empty, and error states.
- [ ] Add integration coverage proving dashboard content matches seeded database-backed API data.
- [ ] Add tests proving goal creation and metric refresh update the rendered dashboard after the backend responds.
- [ ] Add tests for `401`, `403`, `404`, and validation error handling in the frontend.
