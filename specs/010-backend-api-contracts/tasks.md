# Tasks: Backend API Contracts

## Spec Tasks

- [x] Define simple authentication API contracts.
- [x] Define team joining API contract.
- [x] Define goal creation API contract.
- [x] Define Azure DevOps refresh API contract.
- [x] Define shared error response shapes and status codes.

## Implementation Tasks

- [x] Add session storage or an in-memory session boundary.
- [x] Add password hashing and credential verification.
- [x] Add `POST /api/auth/sign-up`.
- [x] Add `POST /api/auth/sign-in`.
- [x] Add `POST /api/auth/sign-out`.
- [x] Add `GET /api/auth/me`.
- [x] Add current-user auth middleware.
- [x] Add team-membership authorization middleware.
- [x] Add `POST /api/teams/join`.
- [x] Add goal creation validation service.
- [x] Add `POST /api/teams/:teamId/goals`.
- [x] Add Azure DevOps metric provider service.
- [x] Add metric refresh persistence behavior.
- [x] Add `POST /api/teams/:teamId/metrics/refresh`.
- [x] Keep existing read-only dashboard endpoints compatible.

## Verification Tasks

- [x] Test sign-up success and duplicate username failure.
- [x] Test sign-in success and invalid credential failure.
- [x] Test sign-out clears access to protected endpoints.
- [x] Test `GET /api/auth/me` for signed-in and anonymous users.
- [x] Test valid and invalid team join codes.
- [x] Test duplicate team join is idempotent.
- [x] Test unauthenticated protected requests return `401`.
- [x] Test non-member team requests return `403`.
- [x] Test valid team goal creation.
- [x] Test valid individual goal creation with a parent team goal.
- [x] Test goal validation errors.
- [x] Test Azure refresh success with mocked Azure responses.
- [x] Test Azure refresh missing config fallback.
- [x] Test Azure refresh upstream failure fallback.
- [x] Verify secrets are not returned in API responses, logs, or fixtures.
