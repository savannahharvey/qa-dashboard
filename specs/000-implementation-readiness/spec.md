# Spec: Implementation Readiness

## Status

Draft

## Summary

Record the decisions and preparation needed before implementation begins. This spec does not start implementation; it defines the agreed order and setup so the project can move from specs to code deliberately.

## Decisions

- App stack: React, TypeScript, and Vite.
- Styling: plain CSS.
- Unit and business-rule tests: Vitest.
- Browser flow tests: Playwright.
- Initial data source: sample data from `docs/sample-data.md`.
- First product surface: read-only dashboard foundation.
- Page shape is already defined by specs `001` through `004`.

## Implementation Order

1. Scaffold the React, TypeScript, and Vite app.
2. Add shared sample data for users, teams, goals, and QA metrics.
3. Add testable progress, status, and metric utility logic.
4. Build the read-only dashboard foundation.
5. Add Vitest unit tests for business rules.
6. Add responsive plain CSS styling.
7. Add Playwright coverage for the primary page flows.
8. Implement auth and team membership.
9. Implement goal creation.
10. Replace sample metric data with repo or CI-derived QA metrics.

## Ready to Implement When

- The stack decision is recorded.
- Sample data is defined.
- The first implementation order is documented.
- The dashboard foundation tasks reference the agreed stack and sample data.

## Out of Scope

- Creating the app scaffold.
- Installing dependencies.
- Writing source code.
- Running implementation tests.
