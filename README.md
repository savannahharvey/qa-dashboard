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

- `000-implementation-readiness`: agreed stack, testing tools, and implementation order.

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
-- Backend foundation: Node.js, Express, TypeScript, PostgreSQL, and SQL migrations.
- Figma-guided screens for landing, sign-in, sign-up, dashboard, team board, and create goal.
- New teams start with zero goals, metrics, and insights — everything is populated by real user activity or a connected Azure DevOps source.

## Local Setup

Install dependencies, open the RDS tunnel, initialize the database, and start the app:

```text
npm install
npm run db:tunnel
npm run db:init
npm run dev
```

Before running `npm run db:tunnel`, make sure both of these are installed and available on PATH:

- AWS CLI
- AWS Session Manager Plugin

The default API URL is `http://localhost:4000`. The Vite frontend runs at `http://127.0.0.1:5173` and proxies API requests to the backend.

The RDS instance is private. Use the bastion host and AWS Systems Manager port forwarding to reach it locally, then point `DATABASE_URL` at `127.0.0.1:5432` while the tunnel is open.

Useful scripts:

- `npm run dev`: starts the API and Vite frontend together.
- `npm run dev:api`: starts only the Express API.
- `npm run dev:web`: starts only the Vite frontend.
- `npm run build`: type-checks the API and frontend, then builds the frontend.
- `npm test`: runs backend and frontend tests.

Useful endpoints:

- `GET /health`
- `GET /api/teams/:teamId/dashboard`
- `GET /api/teams/:teamId/test-suites`
- `GET /api/teams/:teamId/metrics`
- `GET /api/teams/:teamId/goals`

Set `DATABASE_URL` to a PostgreSQL connection string from your current Terraform/Secrets Manager credentials. For the local tunnel, use the forwarded localhost port without forcing SSL:

```text
DATABASE_URL=postgresql://<username>:<password>@127.0.0.1:5432/<dbname>
```

If you need to confirm the username and password, fetch the secret named by the Terraform `secrets_arn` output and build the URL from that JSON payload.

Then run `npm run db:init` to apply the PostgreSQL schema. This only creates tables (`CREATE TABLE IF NOT EXISTS`) — it does not insert any data, so a fresh database and every new team/user start completely empty. Do not point it at a shared or production `DATABASE_URL` unless you intend to (re)apply the schema there.

The tunnel script uses the Terraform outputs in `infra/terraform/`:

```text
bastion_id
db_endpoint
db_port
```

Recommended implementation order:

1. Scaffold the React, TypeScript, and Vite app.
2. Model users, teams, goals, and QA metrics.
3. Add testable progress, status, and metric utility logic.
4. Build the read-only dashboard foundation.
5. Add Vitest unit tests for business rules.
6. Add responsive plain CSS styling.
7. Add Playwright coverage for the primary page flows.
8. Implement auth and team membership.
9. Implement goal creation.
10. Add Azure DevOps test result and coverage data as a real metric source.

For each feature, create a new folder under `specs/` using this pattern:

```text
specs/
  002-feature-name/
    spec.md
    requirements.md
    design.md
    tasks.md
```
