## 1. Backend — GitHub Commit History

- [ ] 1.1 Extend `src/services/githubService.ts` with `getCommitsByWeek(repoUrl, pat, weeks)` — fetches commits from `GET /repos/{owner}/{repo}/commits?since={12weeksAgo}` and groups them by ISO week start date
- [ ] 1.2 Add 1-hour in-memory cache to `githubService.ts` keyed by `teamId` to avoid redundant GitHub API calls on each analytics load

## 2. Backend — CI/CD Velocity Computation

- [ ] 2.1 Add `computeCicdVelocity(teamId)` to `src/services/analyticsService.ts`:
  - Reads GitHub config from `MetricSourceConfig` (returns `{ status: "unavailable" }` if absent)
  - Calls `githubService.getCommitsByWeek` and Azure DevOps builds endpoint in parallel
  - Groups both datasets by ISO week, computes per-week ratio and aggregate ratio
  - Caps aggregate ratio at 1.0; excludes zero-commit weeks from denominator
  - Computes score and generates recommendation string
- [ ] 2.2 Unit test: score is 0 when 0 pipeline runs over 12 weeks with commits present
- [ ] 2.3 Unit test: score is 100 when pipeline runs ≥ commits in all weeks
- [ ] 2.4 Unit test: recommendation string matches correct bucket for each ratio range
- [ ] 2.5 Unit test: zero-commit week is excluded from aggregate denominator

## 3. Frontend — Panel Component

- [ ] 3.1 Create `src/client/components/analytics/CicdVelocityPanel.tsx`:
  - Renders grouped bar chart (pipeline runs vs. commits per week) using inline SVG
  - Overlays a ratio trend line on a secondary axis (0–100%)
  - Handles `status: "unavailable"` with GitHub connect prompt and link to `/dashboard/integrations`
  - Shows tooltip on bar hover with week label, run count, commit count, and ratio
- [ ] 3.2 Integrate `CicdVelocityPanel` into `AnalyticsPage.tsx` panel grid

## 4. Testing

- [ ] 4.1 Unit test: panel renders unavailable state when `status === "unavailable"`
- [ ] 4.2 Unit test: 12 week columns are rendered in the bar chart
- [ ] 4.3 E2E test (requires GitHub + Azure DevOps connected): panel shows alignment ratio and trend bars with real data
