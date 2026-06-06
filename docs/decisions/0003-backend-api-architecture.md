# Decision 0003: Backend API, Schema, and Metric Provider Boundary

## Status

Accepted

## Context

The first backend task is to design storage for users, teams, tests, goals, and QA metrics while leaving room for Azure DevOps automation. Specs `006`, `007`, `008`, and `009` define the core domain shape.

Express 5 is appropriate for this project because it keeps routing simple and now forwards rejected promises to error handling middleware. The first implementation uses committed SQL migrations and a Postgres repository boundary so the backend matches the deployment target from the start.

References:

- Express API reference: https://expressjs.com/en/api.html
- Express error handling guide: https://expressjs.com/en/guide/error-handling.html
## Decision

- Use Node.js, Express, and TypeScript for the backend.
- Use PostgreSQL for development and deployment with SQL migrations in `db/migrations/`.
- Store strict string values for goal scope/status, test category, metric kind/status, and metric source.
- Return lowercase API values matching the specs, such as `tests-passing`, `test-coverage`, and `azure-devops`.
- Model tests explicitly with `TestSuite` records for unit, API, and UI categories.
- Store QA metrics as normalized `QaMetric` rows so sample, manual, and Azure DevOps data use the same dashboard rules.
- Keep Azure DevOps configuration behind `MetricSourceConfig` and server-side environment variables.

## API Shape

Initial REST endpoints:

- `GET /health`
- `GET /api/teams/:teamId/dashboard`
- `GET /api/teams/:teamId/test-suites`
- `GET /api/teams/:teamId/metrics`
- `GET /api/teams/:teamId/goals`

The dashboard endpoint is intentionally aggregate-friendly for the first frontend pass. More granular write endpoints can be added when auth and goal creation are implemented.

## Consequences

- Frontend code can consume normalized metrics without caring whether they came from sample data or Azure DevOps.
- Goal progress calculation is testable outside route handlers.
- The repository boundary stays isolated from route handlers, so changes to storage implementation do not require response-shape changes.
