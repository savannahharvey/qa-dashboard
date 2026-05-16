# QA Dashboard Constitution

## Purpose

This constitution defines the non-negotiable engineering rules for the QA Dashboard project. Feature specs, implementation tasks, code reviews, and release decisions must follow these rules.

## Core Principles

### 1. Test-Driven Development Is Required

All production code must be driven by tests.

- Write or update the failing test before implementing behavior.
- Implement only enough production code to satisfy the test and documented requirement.
- Refactor only after the test suite is passing.
- Do not merge behavior changes that lack automated tests.
- Bug fixes must include a regression test that fails before the fix.

### 2. API Behavior Must Be Fully Automated

Every API contract must have automated verification.

- Every route must have automated tests for successful responses, validation failures, authorization or access-control behavior, and expected error/fallback paths.
- API tests must verify status codes, response shapes, important field values, and secret redaction rules.
- API tests must run against controlled local data and must not depend on live external services.
- New or changed endpoints are not complete until their tests are committed and passing.

### 3. UI Behavior Must Be Fully Automated

Every user-facing UI flow must have automated verification.

- Every page, form, navigation path, protected route, empty state, loading state, and error state must have automated UI or component coverage.
- UI automation must verify behavior, not only that elements exist.
- Critical responsive layouts must be verified for both desktop and mobile viewports.
- Accessibility-critical behavior, including labels, focus, keyboard navigation, and readable states, must be covered where the UI exposes it.
- New or changed UI behavior is not complete until its automation is committed and passing.

### 4. SQLite Is The System Of Record

SQLite is the required persistence layer for this project unless this constitution is amended.

- Schema changes must be expressed as committed SQL migrations under `db/migrations/`.
- Application code must access persisted data through the repository or data-access boundary, not scattered SQL in unrelated modules.
- Tests that touch persistence must use isolated test databases or controlled fixtures.
- Data written to SQLite must use the normalized domain values defined in the specs, such as `tests-passing`, `test-coverage`, and `azure-devops`.

### 5. Node Owns Backend Processing

Node.js is responsible for backend orchestration, data normalization, API handling, and integration work.

- Backend code must use TypeScript.
- Browser code must not call privileged integrations directly.
- Server-side code must normalize domain data before returning it to the UI.
- Business rules should live in testable services or domain helpers instead of being hidden inside route handlers.

### 6. Azure DevOps Integrations Are Server-Side And Read-Only

Azure DevOps API access must be handled through backend services.

- Azure DevOps tokens, PATs, OAuth credentials, and raw secret-bearing payloads must never be returned to the browser or committed to the repository.
- Tests must mock Azure DevOps responses and must not call live Azure DevOps APIs.
- Azure failures must degrade into stable unavailable metrics with non-secret diagnostics.
- Azure data must be normalized into the existing QA metric model before storage or display.
- The first Azure DevOps integration scope is read-only test results and coverage data.

### 7. Specs Govern Implementation

Implementation must trace back to documented intent.

- Every meaningful feature must have a spec folder under `specs/` with `spec.md`, `requirements.md`, `design.md`, and `tasks.md`.
- Tasks must trace to requirements and acceptance criteria.
- Any behavior that contradicts an accepted spec or decision record must update the relevant documentation before code is changed.
- Shared project context belongs in `docs/`; feature-specific context belongs in `specs/`.

### 8. Passing Verification Is Required

Work is not complete until verification is repeatable.

- The build must pass with `npm run build`.
- The automated test suite must pass with `npm test`.
- Database initialization and migrations must be verified when persistence changes.
- Any skipped, flaky, or manual-only verification must be documented as a blocker or explicit follow-up.

## Definition Of Done

A change is done only when all of the following are true:

- The behavior is described by an accepted spec or documented decision.
- Tests were written before or alongside implementation according to TDD.
- API behavior affected by the change has automated coverage.
- UI behavior affected by the change has automated coverage.
- SQLite migrations or data changes are committed when persistence changes.
- Azure DevOps interactions, if involved, are mocked in tests and keep secrets server-side.
- `npm run build` and `npm test` pass locally or any failure is documented with the reason.

## Governance

This constitution has priority over feature specs, implementation tasks, and informal discussion. If a requested change conflicts with this constitution, the constitution wins until it is explicitly amended.

Amendments must:

- Be made in this file.
- Explain the rule being changed and why.
- Preserve or strengthen the project quality bar unless the tradeoff is documented.
- Be reviewed before implementation work depends on the changed rule.

## Ratification

Ratified: 2026-05-16

Current stack baseline:

- Node.js, Express, and TypeScript for backend processing.
- SQLite with committed SQL migrations for persistence.
- React, TypeScript, Vite, plain CSS, Vitest, and Playwright for UI implementation and verification.
- Azure DevOps REST APIs for read-only test result and coverage automation.
