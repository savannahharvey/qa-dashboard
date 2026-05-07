# Decision 0002: Use the Figma Prototype Frontend Stack

## Status

Accepted

## Context

The Figma Make prototype for QA Dashboard exposes a React app structure with Vite configuration, TypeScript source files, Tailwind CSS styles, and shadcn-style UI components. The prototype includes routes and pages for landing, sign-in, sign-up, dashboard layout, team board, and create-goal flows.

## Decision

The first application implementation will use:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn-style UI components.

The route and page inventory from the Figma prototype will guide the initial scaffold:

- `/`
- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/dashboard/goals/new`

## Consequences

- `specs/005-dashboard-foundation/tasks.md` no longer needs to treat the frontend stack as undecided.
- UI implementation should prefer reusable app components and domain-specific dashboard components over copying generated prototype code wholesale.
- Specs remain the source of product truth; Figma is the visual and interaction reference.
- Business rules for progress, status, auth, team scoping, and metric interpretation should live outside page components so they can be tested directly.
