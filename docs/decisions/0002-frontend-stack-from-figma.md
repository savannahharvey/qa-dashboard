# Decision 0002: Use React, TypeScript, Vite, Plain CSS, Vitest, and Playwright

## Status

Accepted

## Context

The Figma Make prototype for QA Dashboard exposes a React app structure with Vite configuration and TypeScript source files. The prototype includes routes and pages for landing, sign-in, sign-up, dashboard layout, team board, and create-goal flows.

The project team has chosen a simpler frontend foundation for the first implementation so the app can stay easy to understand and test while the specs are still maturing.

## Decision

The first application implementation will use:

- React.
- TypeScript.
- Vite.
- Plain CSS.
- Vitest for unit and component-level tests.
- Playwright for browser flow tests.

The route and page inventory from the Figma prototype will guide the initial scaffold:

- `/`
- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/dashboard/goals/new`

## Consequences

- `specs/005-dashboard-foundation/tasks.md` no longer needs to treat the frontend stack as undecided.
- UI implementation should prefer reusable app components and domain-specific dashboard components over copying generated prototype code wholesale.
- Styling should use plain CSS files and project-owned class names.
- Specs remain the source of product truth; Figma is the visual and interaction reference.
- Business rules for progress, status, auth, team scoping, and metric interpretation should live outside page components so they can be tested directly.
