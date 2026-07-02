## Why

The dashboard currently shows raw metrics (pass/fail percentages, goal progress) but provides no interpretation of what those numbers mean for the team's overall QA strategy. Teams have to manually reason about whether their test distribution is healthy, whether CI is keeping pace with code changes, or whether testing gaps exist. An analytics page surfaces these interpretations automatically as actionable insights.

## What Changes

- Add a new page `/dashboard/analytics` to the dashboard navigation.
- Implement an overall QA Health Score (0–100) computed from four insight panels.
- Add a single aggregation API endpoint `GET /api/teams/:teamId/analytics` that computes and returns all panel data in one response.
- Each panel answers one specific question (test type balance, CI/CD velocity, user flow coverage, quality principles). Panels that depend on unavailable data show a clear unavailable state.

## Capabilities

### New Capabilities

- `analytics-page`: The page shell at `/dashboard/analytics` — health score hero, panel grid, last-refreshed timestamp, and panel unavailable states. Does not own the panel content (each panel is its own change); owns the layout, routing, and aggregation endpoint contract.

### Modified Capabilities

<!-- No existing spec-level requirements are changing in this change. Individual panel specs are introduced in separate changes (cicd-velocity-metric, test-type-balance, user-flows, test-quality-principles). -->

## Impact

- `src/client/pages/AnalyticsPage.tsx` — new page (to be created)
- `src/client/App.tsx` — new `/dashboard/analytics` route
- `src/client/components/` — new `HealthScoreRing.tsx`, `AnalyticsPanel.tsx`
- `src/routes/analyticsRoutes.ts` — new file with GET endpoint
- `src/services/analyticsService.ts` — new file orchestrating panel computations
- `src/app.ts` — register analytics routes
