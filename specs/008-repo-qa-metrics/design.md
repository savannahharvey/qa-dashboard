# Design: Repo QA Metrics

## Data Model

```ts
type TestCategory = "unit" | "api" | "ui";
type MetricKind = "tests-passing" | "test-coverage";
type MetricStatus = "passing" | "failing" | "unavailable";

type QaMetric = {
  id: string;
  teamId: string;
  category: TestCategory;
  kind: MetricKind;
  status?: MetricStatus;
  value?: number;
  unit?: "%";
  source: "sample" | "manual" | "azure-devops";
  measuredAt?: string;
};
```

## Metric Interpretation

Tests passing:

- `passing` means the related goal can be considered complete.
- `failing` means the related goal is incomplete and may be at risk.
- `unavailable` means the dashboard should show an unavailable state.

Test coverage:

- Coverage is a percentage value.
- Coverage progress should compare current coverage against the goal target.
- Coverage values should be clamped to the `0` to `100` display range.

## Initial Source

Use sample data first. Later automation should load Azure DevOps test results and coverage without changing dashboard display rules.

## Automated Source

Azure DevOps is the first planned automated source. See `specs/009-azure-devops-test-results/` for endpoint selection, authentication expectations, and normalization rules.

## Dashboard Display

The team board should summarize QA metrics separately from goal rows so the team can scan quality health before reading individual goals. Goal rows may also reference a QA metric when that metric drives progress.

Recommended summary cards:

- Unit tests.
- API tests.
- UI tests.
- Overall coverage or coverage by category.

## Testing Notes

- Test passing, failing, and unavailable statuses.
- Test coverage progress calculation.
- Test unavailable coverage handling.
- Test goal progress when driven by a QA metric.
- Test source-agnostic rendering for sample and Azure DevOps metrics.
