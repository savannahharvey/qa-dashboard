## Context

The `integrations-page` change introduces `githubService.ts` for connectivity checks and stores a GitHub repository connection in `MetricSourceConfig` (source=GITHUB) with an encrypted PAT. This change extends that service to fetch commit and CI-run history for the connected repository. Both are fetched server-side using the stored credentials; no new credential storage is needed.

## Goals / Non-Goals

**Goals:**
- Per-week CI-run count vs. commit count for the last 12 weeks.
- An aggregate alignment ratio for the period and a 0–100 score derived from it.
- A recommendation string based on the aggregate ratio.
- A grouped bar chart (CI runs vs. commits per week) in the frontend panel.

**Non-Goals:**
- Branch-level filtering (default branch only for commits; all workflow runs for the repo).
- Commit authorship or commit message analysis.
- Webhooks or real-time tracking — polling at analytics-load time only.
- Azure DevOps as the "runs" source (see decision below).

## Decisions

**Use GitHub as the single source for both commits and CI runs.**
The metric compares GitHub Actions run frequency (`GET /repos/{owner}/{repo}/actions/runs?created=>=`) against commit frequency (`GET /repos/{owner}/{repo}/commits?since=`) on the default branch. Keeping both sides in one integration means the panel lights up as soon as a repository is connected, with no dependency on Azure DevOps being configured, and both counts describe the same codebase. Alternative considered: Azure DevOps pipeline runs vs. GitHub commits — rejected because it requires two integrations to be connected and risks mismatched codebases between the Azure project and the GitHub repo.

**Fetch via the GitHub REST API rather than GraphQL.**
The REST commit and workflow-run endpoints are simple, well-documented, and sufficient for counting by week. GraphQL adds complexity for no benefit here. Both endpoints are paginated up to 5 pages (≈500 items) to bound API usage over the window.

**Bucket by fixed 7-day windows, not ISO weeks.**
Twelve 7-day buckets are laid out backward from the fetch time. A timestamp's bucket index is `floor((ts - windowStart) / 7 days)`; anything before the window is dropped. This is deterministic and avoids ISO-week edge cases at year boundaries.

**Cache velocity data server-side for 1 hour, keyed by repository.**
GitHub's rate limits (60/hour unauthenticated, 5,000/hour authenticated) are ample, but re-fetching 12 weeks of history on every Insights load is wasteful. A simple in-memory cache keyed by `owner/repo` with a 1-hour TTL avoids redundant calls. Trade-off: cache is lost on server restart — acceptable for a dashboard that doesn't require real-time data.

**Compute the aggregate ratio as `totalRuns / totalCommits`, capped at 1.0.**
The score is `round(ratio * 100)`. Ratios above 1.0 (more runs than commits, e.g. nightly or manually re-triggered builds) are clamped to 1.0 to keep the scale sensible. When there are commits but zero runs the ratio is 0 (code landed with no automated verification); when there are runs but zero commits the ratio is a healthy 1.0. Weeks with zero commits simply contribute 0 to the total-commit denominator, so they never inflate it.

**Inline SVG chart, consistent with the existing `BalanceDonut` / test-results chart.**
No chart library is used in the project. A grouped bar chart in inline SVG follows the same pattern and keeps the bundle size unchanged. The panel uses the shared analytics `{ available: true | false }` shape rather than a bespoke `status` field so it renders through the same `AnalyticsPanel` component as the other panels.

## Risks / Trade-offs

- **GitHub API unavailability / rate limiting**: if GitHub is unreachable, `computeCicdVelocity` catches the error and returns an unavailable panel with a descriptive reason, without affecting the other panels.
- **Repositories without GitHub Actions**: `actions/runs` returns an empty list rather than an error, so the ratio is 0 and the recommendation flags that automation is far behind. Teams whose CI lives outside GitHub Actions will see a low score — documented limitation of the GitHub-only framing.
- **Very active repositories**: the 5-page (≈500-item) pagination cap may not cover 12 weeks for extremely busy repos. Acceptable for expected team usage; the cap can be raised if needed.

## Migration Plan

1. Extend `githubService.ts` with `fetchGithubVelocity` (additive).
2. Add `computeCicdVelocity` to `analyticsService.ts` and include its score in the health-score average (additive).
3. Deploy; the panel appears automatically on the Insights page.
4. If GitHub is not connected, the panel shows its unavailable state — no impact on other panels.
