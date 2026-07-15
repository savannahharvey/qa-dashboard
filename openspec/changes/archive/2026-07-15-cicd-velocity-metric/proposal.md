## Why

Teams often assume their CI pipeline runs on every meaningful code change, but in practice automation is triggered manually, only on `main`, or inconsistently. Without comparing CI run frequency to commit frequency there is no way to know how much code is landing without automated verification. This insight answers "is our automation keeping pace with our code?"

## What Changes

- Add a CI/CD Velocity panel to the Insights page that computes a weekly alignment ratio: `CI runs / commits` over the last 12 weeks.
- Extend `githubService.ts` to fetch commit history and GitHub Actions run history from the GitHub REST API using the team's stored connection (optional PAT).
- Add `computeCicdVelocity` in `analyticsService.ts` for the velocity panel, including per-week bucketing, an aggregate ratio, a 0–100 score that feeds the QA health score, and a recommendation string.
- The panel shows a grouped bar chart (CI runs vs. commits per week) with an alignment percentage.

## Capabilities

### New Capabilities

- `cicd-velocity-metric`: Computes and displays a CI/CD alignment ratio by comparing GitHub Actions run frequency against GitHub commit frequency on the default branch, broken down by week over the last 12 weeks.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. This panel is added to the analytics aggregation endpoint as part of its panel set. -->

## Impact

- `src/services/githubService.ts` — add `fetchGithubVelocity(repoUrl, token?)` (commit + Actions run history, weekly bucketing, 1-hour cache). Shared with the `integrations-page` change.
- `src/services/analyticsService.ts` — add `computeCicdVelocity(githubConfig)` panel computation; include its score in the health-score average.
- `src/client/api.ts` — `ciCdVelocity` becomes a real `CicdVelocityPanel` union instead of an always-unavailable panel.
- `src/client/pages/InsightsPage.tsx` — inline-SVG grouped bar chart for the panel.
- Requires the `integrations-page` change: the GitHub connection must be stored in `MetricSourceConfig` (source=GITHUB) before this panel can produce data.
- Requires the `analytics-page` change: the panel slots into the Insights panel grid.
