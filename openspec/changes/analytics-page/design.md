## Context

The existing dashboard pulls data from multiple endpoints (`/dashboard`, `/metrics`, `/goals`). Analytics requires a new aggregation endpoint that calls into multiple services and returns a unified payload. The four panels (test type balance, CI/CD velocity, user flows, quality principles) are each built in separate changes — this change establishes the page shell and the contract for the aggregation endpoint.

## Goals / Non-Goals

**Goals:**
- One HTTP round-trip from the frontend to get all analytics data.
- A health score that gracefully degrades when panels are unavailable (excluded from denominator, not counted as 0).
- A reusable panel shell component that all four panels slot into.

**Non-Goals:**
- Real-time analytics or websocket updates — refresh is manual.
- Historical health score trend (MVP shows current state only).
- Panel-specific drill-down sub-pages in this change (future work).

## Decisions

**Single aggregation endpoint rather than per-panel endpoints.**
Four separate fetch calls from the frontend would add latency and complexity. A single `GET /api/teams/:teamId/analytics` computes all panels server-side (in parallel where possible) and returns one JSON object. Trade-off: one slow panel blocks the whole response. Mitigation: use `Promise.allSettled` per panel so one failure doesn't block others; failed panels return `{ status: "error" }`.

**Health score excludes unavailable panels from the weighted average denominator.**
If GitHub isn't connected, the CI/CD velocity panel is unavailable. Counting it as 0 would unfairly penalize teams. Excluding it from the denominator gives a score based only on what can be measured. Formula: `sum(available panel scores × weight) / sum(available panel weights) × 100`.

**`AnalyticsPanel` is a generic shell, not a data-fetching component.**
Each panel receives its data as a prop from the page-level fetch. This keeps data fetching in one place and makes panels easy to test in isolation with any data shape.

**Health score ring via CSS conic-gradient, no chart library.**
The project uses no charting library. A CSS `conic-gradient` on a `<div>` with a border-radius of 50% produces a clean ring gauge. Trade-off: limited browser support in very old browsers — acceptable given the target audience (modern browsers only).

## Risks / Trade-offs

- **Panel computation latency**: if one panel's backend service is slow (e.g., GitHub API call), the whole analytics response is delayed. → Use `Promise.allSettled` and a server-side timeout (3s) per panel; return partial results if needed.
- **Stale data**: analytics reflects the last Azure DevOps/GitHub sync, not live state. → Show "last refreshed" timestamp prominently; provide a "Refresh" button that triggers a new sync.

## Migration Plan

1. Deploy `analyticsRoutes.ts` and `analyticsService.ts` (additive, no DB changes).
2. Deploy frontend `AnalyticsPage` and updated nav.
3. Panel content will appear as the four panel-specific changes are implemented and deployed.
4. Rollback: remove the route from `app.ts` and the nav link.
