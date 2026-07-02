## Why

Teams often assume their CI pipeline is running on every meaningful code change, but in practice pipelines are triggered manually, only on main branch merges, or inconsistently. Without comparing pipeline run frequency to commit frequency there is no way to know how much code is being deployed without automated test verification. This insight answers "is our automation keeping pace with our code?"

## What Changes

- Add a CI/CD Velocity panel to the Analytics page that computes a weekly alignment ratio: `pipeline runs / commits` over the last 12 weeks.
- Add a `githubService.ts` that fetches commit history from the GitHub REST API using the team's stored PAT.
- Add computation logic in `analyticsService.ts` for the velocity panel, including per-week bucketing and a recommendation string.
- The panel shows a grouped bar chart (pipeline runs vs. commits per week) with a ratio trend line.

## Capabilities

### New Capabilities

- `cicd-velocity-metric`: Computes and displays a CI/CD alignment ratio by comparing Azure DevOps pipeline run frequency against GitHub commit frequency, broken down by week over the last 12 weeks.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. This panel is added to the analytics-page aggregation endpoint as part of its panel set. -->

## Impact

- `src/services/githubService.ts` — new file (may be shared with integrations-page change)
- `src/services/analyticsService.ts` — add `computeCicdVelocity(teamId)` panel computation
- `src/client/components/analytics/CicdVelocityPanel.tsx` — new panel component
- Requires `integrations-page` change: GitHub connection must be stored in `MetricSourceConfig` before this panel can produce data
- Requires `analytics-page` change: panel slots into the analytics page panel grid
