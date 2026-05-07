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
  source: "sample" | "manual" | "automated";
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

Use sample data first. Later automation can parse test and coverage output from the repo or CI pipeline without changing dashboard display rules.

## Testing Notes

- Test passing, failing, and unavailable statuses.
- Test coverage progress calculation.
- Test unavailable coverage handling.
