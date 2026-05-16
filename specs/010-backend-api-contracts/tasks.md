# Tasks: Backend API Contracts

## Spec Tasks

- [x] Define simple authentication API contracts.
- [x] Define team joining API contract.
- [x] Define goal creation API contract.
- [x] Define Azure DevOps refresh API contract.
- [x] Define shared error response shapes and status codes.

## Implementation Tasks

- [ ] Add session storage or an in-memory session boundary.
- [ ] Add password hashing and credential verification.
- [ ] Add `POST /api/auth/sign-up`.
- [ ] Add `POST /api/auth/sign-in`.
- [ ] Add `POST /api/auth/sign-out`.
- [ ] Add `GET /api/auth/me`.
- [ ] Add current-user auth middleware.
- [ ] Add team-membership authorization middleware.
- [ ] Add `POST /api/teams/join`.
- [ ] Add goal creation validation service.
- [ ] Add `POST /api/teams/:teamId/goals`.
- [ ] Add Azure DevOps metric provider service.
- [ ] Add metric refresh persistence behavior.
- [ ] Add `POST /api/teams/:teamId/metrics/refresh`.
- [ ] Keep existing read-only dashboard endpoints compatible.

## Verification Tasks

- [ ] Test sign-up success and duplicate username failure.
- [ ] Test sign-in success and invalid credential failure.
- [ ] Test sign-out clears access to protected endpoints.
- [ ] Test `GET /api/auth/me` for signed-in and anonymous users.
- [ ] Test valid and invalid team join codes.
- [ ] Test duplicate team join is idempotent.
- [ ] Test unauthenticated protected requests return `401`.
- [ ] Test non-member team requests return `403`.
- [ ] Test valid team goal creation.
- [ ] Test valid individual goal creation with a parent team goal.
- [ ] Test goal validation errors.
- [ ] Test Azure refresh success with mocked Azure responses.
- [ ] Test Azure refresh missing config fallback.
- [ ] Test Azure refresh upstream failure fallback.
- [ ] Verify secrets are not returned in API responses, logs, or fixtures.
