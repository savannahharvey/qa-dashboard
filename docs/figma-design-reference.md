# Figma Design Reference

## Source

Figma Make file:

https://www.figma.com/make/jR9aMZDETPylRs87xHlcTI/QA-Dashboard?t=tuO7xeHvyPxgePw1-1&preview-route=%2Fdashboard

Reviewed with the Figma MCP on 2026-05-07.

## Implementation Signal From Figma

The Figma Make project exposes a React app prototype. The available source inventory identifies these implementation-level pieces:

- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/app/context/AuthContext.tsx`
- `src/app/pages/LandingPage.tsx`
- `src/app/pages/SignInPage.tsx`
- `src/app/pages/SignUpPage.tsx`
- `src/app/pages/DashboardLayout.tsx`
- `src/app/pages/TeamBoard.tsx`
- `src/app/pages/CreateGoal.tsx`
- `src/app/components/ui/*`
- `src/styles/tailwind.css`
- `src/styles/theme.css`
- `src/styles/globals.css`
- `vite.config.ts`
- `package.json`

The prototype should be treated as the current product direction for route structure, page inventory, and UI system choices.

## Product Screens

The first implementation should plan for these screens:

- Landing page for unauthenticated users.
- Sign-in page.
- Sign-up page.
- Protected dashboard layout.
- Team board dashboard view.
- Create goal view.

The Figma URL preview route points to `/dashboard`, so the dashboard should be the primary authenticated experience.

## UI System Direction

The prototype uses a React, TypeScript, Vite, Tailwind CSS, and shadcn-style component structure. The project implementation will use the stack recorded in `docs/decisions/0002-frontend-stack-from-figma.md`: React, TypeScript, Vite, plain CSS, Vitest, and Playwright. Figma remains the visual and interaction reference, not the source of technical architecture.

Use the Figma design as a behavioral and layout reference, not as a place to copy generated code blindly. Implementation should still follow the specs in `specs/`, keep business rules testable, and separate domain logic from rendering.

## Spec Traceability

UI/page specs:

- Home page behavior maps to `specs/001-home-page/`.
- Sign-in and sign-up page behavior maps to `specs/002-auth-pages/`.
- Dashboard layout and team board page behavior maps to `specs/003-dashboard-page/`.
- Create-goal page behavior maps to `specs/004-create-goal-page/`.

Domain/data specs:

- Dashboard domain behavior maps to `specs/005-dashboard-foundation/`.
- Sign-in, sign-up, and auth context behavior maps to `specs/006-auth-and-team-membership/`.
- Goal creation behavior maps to `specs/007-goal-management/`.
- QA metric cards and goal metric displays map to `specs/008-repo-qa-metrics/`.

## Known MCP Limitation

During the 2026-05-07 review, the Figma MCP returned the Make source inventory but did not allow direct reading of individual `file://figma/make/source/...` resources from this session. A later implementation pass should re-read the Figma source files if that resource access becomes available.
