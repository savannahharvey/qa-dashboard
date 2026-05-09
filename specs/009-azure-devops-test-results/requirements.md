# Requirements: Azure DevOps Test Results

## Functional Requirements

### Requirement 1: Configure Azure DevOps Source

The system must accept Azure DevOps connection settings for an organization, project, and optional pipeline or build filters.

Acceptance criteria:

- Given an organization and project are configured, when metrics refresh, then Azure DevOps test run endpoints are queried for that project.
- Given a build ID or build definition filter is configured, when metrics refresh, then only matching test runs are considered.
- Given configuration is missing, when metrics refresh, then Azure-sourced metrics are marked unavailable without breaking the dashboard.

### Requirement 2: Gather Test Runs and Results

The system must read Azure DevOps test runs and test results.

Acceptance criteria:

- Given completed automated runs exist, when metrics refresh, then the latest relevant completed runs are selected.
- Given a selected run has test results, when metrics refresh, then passed and failed outcomes are counted.
- Given Azure DevOps returns an error, when metrics refresh, then the dashboard shows unavailable metrics and preserves the error for diagnostics.

### Requirement 3: Gather Coverage

The system must read Azure DevOps coverage data when coverage is published.

Acceptance criteria:

- Given a selected build has coverage data, when metrics refresh, then coverage percent is converted into `test-coverage` metrics.
- Given coverage data is absent, when metrics refresh, then coverage metrics are marked unavailable.
- Given Azure DevOps returns more detail than the dashboard needs, when metrics refresh, then only normalized coverage values are exposed to dashboard components.

### Requirement 4: Normalize Azure Data

Azure DevOps data must be normalized into the existing QA metric model.

Acceptance criteria:

- Given all selected test results passed, then the related `tests-passing` metric status is `passing`.
- Given any selected test result failed, errored, timed out, or aborted, then the related `tests-passing` metric status is `failing`.
- Given selected data cannot determine a category, then the metric category remains unavailable rather than guessed.

## Non-Functional Requirements

- Azure DevOps tokens must be loaded from runtime configuration or a backend secret store, never from committed sample data.
- Azure API calls should be isolated behind a service boundary so the dashboard can continue using sample metrics in local development.
- Network and authorization failures should be observable for developers but not expose secrets in the UI.
- Tests should cover endpoint URL construction, outcome mapping, coverage mapping, and failure fallback behavior.
