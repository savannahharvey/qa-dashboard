## 1. Backend — GitHub Commit & CI Run History

- [x] 1.1 Extend `src/services/githubService.ts` with `fetchGithubVelocity(repoUrl, token?)` — fetches commits (`GET /repos/{owner}/{repo}/commits?since=`) and GitHub Actions runs (`GET /repos/{owner}/{repo}/actions/runs?created=>=`), bucketing both into twelve 7-day windows and returning `{ weeks, totalCommits, totalRuns }`
- [x] 1.2 Paginate both endpoints up to 5 pages (~500 items) to bound API usage over the window
- [x] 1.3 Add a 1-hour in-memory cache keyed by `owner/repo`; expose `clearVelocityCache()` for tests

## 2. Backend — CI/CD Velocity Computation

- [x] 2.1 Add `computeCicdVelocity(githubConfig)` to `src/services/analyticsService.ts`:
  - Reads the GitHub config from `MetricSourceConfig` and returns `{ available: false, reason }` when absent, disabled, or missing a repo URL
  - Decrypts the stored PAT (falls back to no token — public repos still work)
  - Calls `fetchGithubVelocity`; aggregate ratio = `min(1, totalRuns / totalCommits)`; score = `round(ratio * 100)`
  - Returns `{ available: false }` on fetch error or when there is no history
  - Generates a recommendation string per ratio band
- [x] 2.2 Include the panel score in the averaged QA health score
- [x] 2.3 Unit test: unavailable when GitHub is not connected / disabled
- [x] 2.4 Unit test: score is 70 for 10 commits / 7 runs; capped at 100 when runs exceed commits
- [x] 2.5 Unit test: unavailable when there is no history; error reason when the fetch fails
- [x] 2.6 Unit test (`githubService`): weekly bucketing and totals, per-repo caching, error propagation

## 3. Frontend — Panel

- [x] 3.1 Change `TeamAnalytics.ciCdVelocity` in `src/client/api.ts` from an always-unavailable panel to a `CicdVelocityPanel` union
- [x] 3.2 Render the panel in `src/client/pages/InsightsPage.tsx` via a `VelocityChart` inline-SVG grouped bar chart (CI runs vs. commits per week), a legend with totals, an alignment percentage, and the recommendation
- [x] 3.3 Keep the unavailable state rendering through the shared `AnalyticsPanel` with the connect prompt
- [x] 3.4 Add velocity panel styles to `src/client/styles.css`

## Notes

- Divergence from the original proposal: the "runs" source is **GitHub Actions**, not Azure DevOps pipeline runs. This keeps the metric within a single integration so the panel works as soon as a repository is connected. See `design.md` → Decisions.
- No standalone `CicdVelocityPanel.tsx` component or ratio trend line was added; the chart is rendered inline in `InsightsPage.tsx` to match the existing analytics panels. A full E2E test against live GitHub data was not added (requires a connected repo with history).
