# qa-dashboard
This dashboard will allow us to see our goals for our team in more tangible and trackable ways. It will encourage collaboration and team building as we work together toward our goals.

## Spec-Driven Development

This project uses a spec-driven workflow. Before implementing a feature, define the product intent, expected behavior, design decisions, and implementation tasks in the `docs/` and `specs/` folders.

Start here:

1. Read `docs/product-brief.md` to understand the project purpose.
2. Review `docs/glossary.md` for shared terms.
3. Review `docs/figma-design-reference.md` for the current Figma prototype alignment.
4. Check `docs/decisions/` for recorded project decisions.
5. Start implementation planning with `specs/000-implementation-readiness/`.

Current specs:

Preparation specs:

- `000-implementation-readiness`: agreed stack, sample data, testing tools, and implementation order.

UI/page specs:

- `001-home-page`: public landing page from the Figma prototype.
- `002-auth-pages`: sign-in and sign-up pages from the Figma prototype.
- `003-dashboard-page`: protected dashboard and team board page from the Figma prototype.
- `004-create-goal-page`: goal creation page from the Figma prototype.

Domain/data specs:

- `005-dashboard-foundation`: dashboard behavior for goals, owners, progress, status, and initial QA metrics.
- `006-auth-and-team-membership`: username/password sign-in, team membership, and protected data scope.
- `007-goal-management`: team goals, individual goals, ownership, relationships, and optional dates.
- `008-repo-qa-metrics`: tests passing and test coverage for unit, API, and UI tests.
- `009-azure-devops-test-results`: read-only Azure DevOps REST API integration for test results and coverage.
- `010-backend-api-contracts`: simple auth, team joining, goal creation, and Azure metric refresh API contracts.

Current implementation direction:

- React, TypeScript, Vite, plain CSS, Vitest, and Playwright.
-- Backend foundation: Node.js, Express, TypeScript, PostgreSQL on AWS RDS, and SQL migrations.
- Figma-guided screens for landing, sign-in, sign-up, dashboard, team board, and create goal.
- Sample data is defined in `docs/sample-data.md`.
- Azure DevOps is the planned first automated source for QA metrics after the sample dashboard is stable.

## Local Setup

Install dependencies, initialize the configured database, and start the app:

```text
npm install
npm run db:init
npm run dev
```

The default API URL is `http://localhost:4000`. The Vite frontend runs at `http://127.0.0.1:5173` and proxies API requests to the backend.

Useful scripts:

- `npm run dev`: starts the API and Vite frontend together.
- `npm run dev:api`: starts only the Express API.
- `npm run dev:web`: starts only the Vite frontend.
- `npm run build`: type-checks the API and frontend, then builds the frontend.
- `npm test`: runs backend and frontend tests.

Useful endpoints:

- `GET /health`
- `GET /api/teams/team-qa/dashboard`
- `GET /api/teams/team-qa/test-suites`
- `GET /api/teams/team-qa/metrics`
- `GET /api/teams/team-qa/goals`

Set `DATABASE_URL` to a PostgreSQL connection string:

```text
DATABASE_URL=postgresql://<username>:<password>@<rds-endpoint>:5432/<dbname>?sslmode=require
```

Then run `npm run db:init` to apply the PostgreSQL schema and seed the QA dashboard sample data.

Recommended implementation order:

1. Scaffold the React, TypeScript, and Vite app.
2. Add shared sample data for users, teams, goals, and QA metrics.
3. Add testable progress, status, and metric utility logic.
4. Build the read-only dashboard foundation.
5. Add Vitest unit tests for business rules.
6. Add responsive plain CSS styling.
7. Add Playwright coverage for the primary page flows.
8. Implement auth and team membership.
9. Implement goal creation.
10. Replace sample metric data with Azure DevOps test result and coverage data.

For each feature, create a new folder under `specs/` using this pattern:

```text
specs/
  002-feature-name/
    spec.md
    requirements.md
    design.md
    tasks.md
```
