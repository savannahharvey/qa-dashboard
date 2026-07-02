## 1. Backend — Analytics Service & Route

- [ ] 1.1 Create `src/services/analyticsService.ts` with `computeAnalytics(teamId)` that calls all four panel services via `Promise.allSettled` with a 3-second timeout per panel, assembles results, and computes the weighted health score
- [ ] 1.2 Implement `computeHealthScore(panels)` — weighted average of available panels (weight 25 each; exclude unavailable from denominator)
- [ ] 1.3 Create `src/routes/analyticsRoutes.ts` with `GET /api/teams/:teamId/analytics` returning `{ healthScore, lastRefreshedAt, panels }`
- [ ] 1.4 Register analytics routes in `src/app.ts`
- [ ] 1.5 Unit test: `computeHealthScore` excludes unavailable panels from denominator
- [ ] 1.6 Unit test: a single failed panel returns `{ status: "error" }` without crashing the entire response

## 2. Frontend — Shared Components

- [ ] 2.1 Create `src/client/components/HealthScoreRing.tsx` — CSS `conic-gradient` ring showing score (0–100) with color-coded fill and a label ("Good" / "Needs Attention" / "At Risk")
- [ ] 2.2 Create `src/client/components/AnalyticsPanel.tsx` — reusable panel shell with title, score badge, content slot, recommendation callout box, and unavailable state renderer

## 3. Frontend — Page & Routing

- [ ] 3.1 Create `src/client/pages/AnalyticsPage.tsx` with the health score hero section and a 2-column panel grid (stacked on mobile)
- [ ] 3.2 Add `getAnalytics(teamId)` to `src/client/api.ts`
- [ ] 3.3 Add `/dashboard/analytics` route in `src/client/App.tsx`
- [ ] 3.4 Add "Analytics" nav link in the dashboard shell/header

## 4. Testing

- [ ] 4.1 Unit test: `HealthScoreRing` renders green fill for score ≥ 75, yellow for 50–74, red below 50
- [ ] 4.2 Unit test: `AnalyticsPanel` renders the unavailable state when passed `status: "unavailable"`
- [ ] 4.3 E2E test: navigate to `/dashboard/analytics`, verify health score ring renders and at least one panel is visible
- [ ] 4.4 E2E test: panels without required integrations show the correct unavailable message
