# Spec: Azure DevOps Test Results

## Status

Draft

## Spec Type

Integration spec. This spec describes how the dashboard gathers QA metrics from public Azure DevOps REST API endpoints.

## Summary

Connect the QA dashboard to Azure DevOps test result endpoints so unit, API, and UI test status and coverage can be gathered automatically instead of relying only on sample data.

## User Story

As a team member, I want the dashboard to pull test results from Azure DevOps so that quality goals reflect the latest pipeline evidence.

## Scope

- Azure DevOps organization, project, and optional pipeline/build configuration.
- Read-only retrieval of test runs.
- Read-only retrieval of test results for selected runs.
- Read-only retrieval of build or test-run code coverage when available.
- Normalization into the existing `QaMetric` model from `specs/008-repo-qa-metrics/`.
- Graceful fallback to unavailable metrics when Azure DevOps data cannot be read.

## Out of Scope

- Creating, updating, or deleting Azure DevOps test runs.
- Mutating Azure DevOps work items, test plans, or pipelines.
- Long-term historical trend storage.
- Supporting non-Azure CI providers.

## Public Azure DevOps Endpoints

The implementation should prefer the stable Test service endpoints first:

- List test runs: `GET https://dev.azure.com/{organization}/{project}/_apis/test/runs?api-version=7.1`
- Query recent test runs: `GET https://dev.azure.com/{organization}/{project}/_apis/test/runs?minLastUpdatedDate={minLastUpdatedDate}&maxLastUpdatedDate={maxLastUpdatedDate}&api-version=7.1`
- List test results for a run: `GET https://dev.azure.com/{organization}/{project}/_apis/test/Runs/{runId}/results?api-version=7.1`
- Get build code coverage: `GET https://dev.azure.com/{organization}/{project}/_apis/test/codecoverage?buildId={buildId}&flags={flags}&api-version=7.1`

The implementation may use the newer Test Results service endpoints when needed for richer result or coverage data:

- List test result runs: `GET https://vstmr.dev.azure.com/{organization}/{project}/_apis/testresults/runs?api-version=7.1-preview.1`
- Get test results for a run: `GET https://vstmr.dev.azure.com/{organization}/{project}/_apis/testresults/runs/{runId}/results?api-version=7.1-preview.2`
- Get build code coverage: `GET https://vstmr.dev.azure.com/{organization}/{project}/_apis/testresults/codecoverage?buildId={buildId}&flags={flags}&api-version=7.1-preview.1`

## Decisions

- Azure DevOps access is read-only.
- The required permission scope is test-result read access, represented by Azure DevOps OAuth scope `vso.test` or an equivalent read-only Personal Access Token permission.
- Credentials must not be stored in source-controlled sample data.
- The dashboard should keep rendering with sample or unavailable metrics if the Azure DevOps connection is missing, unauthorized, rate limited, or malformed.
- Azure result outcomes map to dashboard status: `Passed` maps to `passing`; `Failed`, `Error`, `Timeout`, and `Aborted` map to `failing`; missing or in-progress data maps to `unavailable`.

## Related Specs

- `specs/003-dashboard-page/`
- `specs/005-dashboard-foundation/`
- `specs/008-repo-qa-metrics/`
