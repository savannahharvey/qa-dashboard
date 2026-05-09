# Decision 0003: Backend API, Schema, and Metric Provider Boundary

## Status

Accepted

## Context

The first backend task is to design storage for users, teams, tests, goals, and QA metrics while leaving room for Azure DevOps automation. Specs `006`, `007`, `008`, and `009` define the core domain shape.

Express 5 is appropriate for this project because it keeps routing simple and now forwards rejected promises to error handling middleware. SQLite keeps local setup lightweight for the class project. The first implementation uses committed SQL migrations plus Node's built-in `node:sqlite` module because this repository is being developed on Windows ARM64, where Prisma's native query engine was not usable in local verification.

References:

- Express API reference: https://expressjs.com/en/api.html
- Express error handling guide: https://expressjs.com/en/guide/error-handling.html
- Node.js SQLite API: https://nodejs.org/api/sqlite.html

## Decision

- Use Node.js, Express, and TypeScript for the backend.
- Use SQLite for local development with SQL migrations in `db/migrations/`.
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
- SQLite is enough for the class project now. If deployment later needs PostgreSQL, the repository boundary can be swapped without changing route response shapes.
