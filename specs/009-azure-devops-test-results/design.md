# Design: Azure DevOps Test Results

## Integration Shape

The dashboard should use a small data-provider boundary:

```ts
type QaMetricSource = "sample" | "manual" | "azure-devops";

type AzureDevOpsConfig = {
  organization: string;
  project: string;
  buildId?: number;
  buildDefinitionIds?: number[];
  branchName?: string;
  runTitle?: string;
};

type AzureDevOpsMetricFetchResult = {
  metrics: QaMetric[];
  fetchedAt: string;
  diagnostics?: {
    source: "azure-devops";
    message: string;
  };
};
```

The UI should consume normalized `QaMetric` objects only. Azure-specific response shapes should stay inside the Azure DevOps data provider.

## Endpoint Strategy

1. Query or list recent completed automated runs.
2. Select the latest relevant run per configured test category.
3. Fetch result details for each selected run.
4. Fetch code coverage by build ID when the run or configuration provides one.
5. Convert results and coverage into `QaMetric` entries.
6. Return unavailable metrics for any category that cannot be resolved.

## Category Mapping

The first implementation should use explicit configuration to map Azure runs to dashboard categories:

```ts
type AzureDevOpsCategoryMap = {
  unit?: { runTitleIncludes?: string; buildDefinitionId?: number };
  api?: { runTitleIncludes?: string; buildDefinitionId?: number };
  ui?: { runTitleIncludes?: string; buildDefinitionId?: number };
};
```

If explicit mapping is not configured, the provider may use conservative title matching for `unit`, `api`, and `ui`, but it must not invent a category when the match is ambiguous.

## Result Mapping

Azure DevOps result outcomes should map to dashboard states as follows:

- `Passed` maps to `passing`.
- `Failed`, `Error`, `Timeout`, and `Aborted` map to `failing`.
- `InProgress`, `NotExecuted`, `NotApplicable`, absent data, and unrecognized outcomes map to `unavailable`.

A category is passing only when all selected completed results for that category passed.

## Coverage Mapping

Coverage should be represented as a `test-coverage` metric with `unit: "%"`. When Azure returns covered and total values, calculate:

```ts
coveragePercent = total > 0 ? Math.round((covered / total) * 100) : undefined;
```

Coverage values must still be clamped to the dashboard display range described in `specs/008-repo-qa-metrics/design.md`.

## Authentication

Local development may use a Personal Access Token from an ignored environment variable. A deployed version should call Azure DevOps from a backend or server-side function so tokens are not exposed in browser code.

Recommended environment variables:

```text
AZURE_DEVOPS_ORG=
AZURE_DEVOPS_PROJECT=
AZURE_DEVOPS_PAT=
```

## Refresh API

The first manual refresh API is defined in `specs/010-backend-api-contracts/` as `POST /api/teams/:teamId/metrics/refresh`.

The endpoint should call the Azure DevOps provider from the backend, persist normalized `QaMetric` rows, and return unavailable metrics with non-secret diagnostics when configuration or upstream requests fail.

## Testing Notes

- Mock Azure DevOps HTTP responses rather than calling live endpoints in unit tests.
- Verify the provider returns unavailable metrics when configuration is incomplete.
- Verify endpoint paths use `dev.azure.com` for stable Test APIs and `vstmr.dev.azure.com` only for Test Results preview APIs.
- Verify credentials are not logged or displayed.
