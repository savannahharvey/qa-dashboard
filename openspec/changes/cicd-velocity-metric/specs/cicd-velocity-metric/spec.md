## ADDED Requirements

### Requirement: CI/CD velocity panel computes a weekly alignment ratio
The analytics service SHALL compute a CI/CD alignment ratio for each of the last 12 weeks by comparing the number of completed Azure DevOps pipeline runs to the number of GitHub commits on the default branch.

#### Scenario: Ratio computed when both data sources are available
- **WHEN** both GitHub integration and Azure DevOps integration are configured for a team
- **THEN** the panel SHALL return a per-week ratio (`pipelineRuns / commits`) and an aggregate alignment ratio across all 12 weeks

#### Scenario: Weeks with zero commits excluded from ratio calculation
- **WHEN** a week has zero commits in the GitHub repository
- **THEN** that week SHALL be excluded from the aggregate ratio denominator (treated as ratio = 1.0 for that week)

#### Scenario: Aggregate ratio capped at 1.0
- **WHEN** total pipeline runs exceed total commits over the 12-week period
- **THEN** the aggregate alignment ratio SHALL be capped at 1.0

### Requirement: CI/CD velocity panel score is derived from alignment ratio
The panel SHALL compute a score (0–100) equal to `Math.round(alignmentRatio * 100)`, capped at 100.

#### Scenario: Score reflects alignment ratio
- **WHEN** the alignment ratio is 0.68
- **THEN** the panel score SHALL be 68

### Requirement: CI/CD velocity panel generates a recommendation based on ratio
The panel SHALL include a recommendation string appropriate to the alignment ratio bucket.

#### Scenario: Recommendation for high alignment
- **WHEN** the alignment ratio is ≥ 0.9
- **THEN** the recommendation SHALL indicate excellent coverage (e.g., "Almost every commit triggers a pipeline run")

#### Scenario: Recommendation for medium alignment
- **WHEN** the alignment ratio is between 0.6 and 0.9
- **THEN** the recommendation SHALL suggest adding a PR trigger

#### Scenario: Recommendation for low alignment
- **WHEN** the alignment ratio is below 0.6
- **THEN** the recommendation SHALL flag that pipelines are running infrequently and suggest reviewing triggers

### Requirement: Panel returns unavailable state when GitHub is not connected
The CI/CD velocity panel SHALL return `{ status: "unavailable", reason: "GitHub not connected" }` when no GitHub integration is configured for the team.

#### Scenario: Unavailable when GitHub config is absent
- **WHEN** the team has no `MetricSourceConfig` row for `source=GITHUB`
- **THEN** the panel data SHALL have `status: "unavailable"` and the analytics page SHALL show the GitHub connect prompt
