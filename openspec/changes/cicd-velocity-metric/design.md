## Context

The `integrations-page` change introduces `githubService.ts` for connectivity checks. This change extends that service to fetch commit history. Azure DevOps pipeline run history is already available via `GET /_apis/build/builds` (the same API used in `azureMetricsService.ts`). Both data sources are fetched server-side using stored credentials; no new credential storage is needed.

## Goals / Non-Goals

**Goals:**
- Per-week pipeline run count vs. commit count for the last 12 weeks.
- An alignment ratio per week and an aggregate ratio for the period.
- A recommendation string based on the aggregate ratio.
- A grouped bar chart with an overlay ratio line in the frontend panel.

**Non-Goals:**
- Branch-level filtering (default branch only for commits; all runs for the configured pipeline).
- Commit authorship or commit message analysis.
- Webhooks or real-time tracking — polling at refresh time only.

## Decisions

**Fetch GitHub commits via REST API rather than GraphQL.**
The GitHub REST `GET /repos/{owner}/{repo}/commits` endpoint is simple, well-documented, and sufficient for counting commits by week. GraphQL would offer more flexibility but adds complexity for no benefit in this use case.

**Cache GitHub commit data server-side for 1 hour per team.**
GitHub's unauthenticated rate limit (60/hour) and authenticated limit (5,000/hour) are both fine for team usage. However, re-fetching 12 weeks of commits on every analytics page load is wasteful. A simple in-memory cache keyed by `teamId` with a 1-hour TTL avoids redundant API calls. Trade-off: cache is lost on server restart — acceptable for a dashboard that doesn't require real-time data.

**Compute alignment ratio as `totalPipelineRuns / totalCommits`, capped at 1.0.**
Ratios above 1.0 (more runs than commits, possible with nightly builds or manual triggers) are clamped to 1.0 to keep the score scale sensible. Weeks with 0 commits are excluded from the denominator to avoid division by zero; they contribute a ratio of 1.0 (no commits, no need to run).

**Inline SVG chart, consistent with existing `TestResultsOverTime` component.**
No chart library is used in the project. A grouped bar chart using inline SVG follows the same pattern as the existing component and keeps the bundle size unchanged.

## Risks / Trade-offs

- **GitHub API unavailability**: if GitHub is down or rate-limited, the panel returns `{ status: "error" }` without affecting other panels. → Use `Promise.allSettled` at the analytics service level.
- **Monorepo commits inflate ratio**: if the repo has many commits unrelated to the tested service, the ratio appears lower than it should. → Accepted limitation for MVP; no per-directory commit filtering.
- **Azure DevOps run history pagination**: `$top=100` may not cover 12 weeks for very active pipelines. → Increase `$top` or add pagination in the Azure DevOps builds fetch; 100 is sufficient for most teams.

## Migration Plan

1. Extend `githubService.ts` with commit history fetching (additive).
2. Add `computeCicdVelocity` to `analyticsService.ts` (additive).
3. Deploy and the panel appears automatically on the analytics page.
4. If GitHub is not connected, panel shows unavailable state — no impact on other panels.
