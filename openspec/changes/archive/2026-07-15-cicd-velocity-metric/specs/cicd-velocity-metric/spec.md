## ADDED Requirements

### Requirement: CI/CD velocity panel compares CI runs to commits by week
The analytics service SHALL compute a CI/CD alignment metric over the last 12 weeks by comparing the number of GitHub Actions runs to the number of GitHub commits on the connected repository's default branch, bucketed into twelve 7-day windows.

#### Scenario: Per-week counts returned when GitHub is connected
- **WHEN** a team has an enabled GitHub integration with a repository URL
- **THEN** the panel SHALL return twelve weekly buckets, each with a commit count and a CI-run count, plus period totals for commits and runs

#### Scenario: History fetched with the stored connection
- **WHEN** the panel is computed
- **THEN** the service SHALL fetch commits from `GET /repos/{owner}/{repo}/commits?since=` and runs from `GET /repos/{owner}/{repo}/actions/runs?created=>=`, using the team's stored PAT when present, and SHALL cache the result per repository for one hour

### Requirement: Aggregate alignment ratio and score
The panel SHALL compute an aggregate alignment ratio of `totalRuns / totalCommits`, capped at 1.0, and a score equal to `Math.round(ratio * 100)`.

#### Scenario: Score reflects the alignment ratio
- **WHEN** there are 10 commits and 7 CI runs over the period
- **THEN** the aggregate ratio SHALL be 0.7 and the panel score SHALL be 70

#### Scenario: Ratio capped when runs exceed commits
- **WHEN** total CI runs exceed total commits over the 12-week period
- **THEN** the aggregate ratio SHALL be capped at 1.0 (score 100)

#### Scenario: Commits with no runs score zero
- **WHEN** there are commits but zero CI runs over the period
- **THEN** the aggregate ratio SHALL be 0 (score 0)

### Requirement: CI/CD velocity panel generates a recommendation based on ratio
The panel SHALL include a recommendation string appropriate to the aggregate alignment ratio.

#### Scenario: Recommendation for high alignment
- **WHEN** the alignment ratio is ≥ 0.9
- **THEN** the recommendation SHALL indicate automation is keeping pace with commits

#### Scenario: Recommendation for medium alignment
- **WHEN** the alignment ratio is ≥ 0.6 and < 0.9
- **THEN** the recommendation SHALL note that some commits slip through and suggest running the pipeline on every push and pull request

#### Scenario: Recommendation for low alignment
- **WHEN** the alignment ratio is < 0.6
- **THEN** the recommendation SHALL flag that CI runs are lagging behind commits and that code is landing without automated verification

### Requirement: Panel returns an unavailable state instead of failing
The CI/CD velocity panel SHALL return `{ available: false, reason }` — rather than throwing — whenever it cannot produce data, so other analytics panels are unaffected.

#### Scenario: Unavailable when GitHub is not connected
- **WHEN** the team has no enabled `MetricSourceConfig` row for `source=GITHUB`, or the stored config has no repository URL
- **THEN** the panel SHALL be `{ available: false }` with a reason prompting the user to connect a GitHub repository on the Integrations page

#### Scenario: Unavailable when there is no history
- **WHEN** the connected repository has zero commits and zero CI runs in the last 12 weeks
- **THEN** the panel SHALL be `{ available: false }` with a reason indicating there is no recent history

#### Scenario: Unavailable when GitHub cannot be reached
- **WHEN** the GitHub history fetch fails or the API is unreachable
- **THEN** the panel SHALL be `{ available: false }` with a descriptive reason, and the other analytics panels SHALL still be computed

### Requirement: CI/CD velocity score contributes to the QA health score
When the panel is available, its score SHALL be included in the averaged QA health score alongside the other available analytics panels.

#### Scenario: Score included in the health-score average
- **WHEN** the CI/CD velocity panel is available with a score
- **THEN** that score SHALL be one of the values averaged into the team's overall QA health score
