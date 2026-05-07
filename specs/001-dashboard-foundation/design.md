# Design: Dashboard Foundation

## Approach

Build the first dashboard as a thin vertical slice. It should prioritize clear data modeling and visible behavior over advanced UI or backend features.

## Data Model

Initial goal shape:

```ts
type Goal = {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  scope: "team" | "individual";
  parentGoalId?: string;
  metricType?: "tests-passing" | "test-coverage";
  testCategory?: "unit" | "api" | "ui";
  currentValue: number;
  targetValue: number;
  unit?: string;
  dueDate?: string;
  status?: "active" | "completed" | "at-risk";
};
```

Status can either be stored or derived. For the foundation, deriving status from goal data is preferred so the behavior is consistent and testable.

## Progress Rule

Progress percentage:

```text
currentValue / targetValue * 100
```

Rules:

- Cap displayed progress at 100%.
- Avoid division when `targetValue` is `0`.
- Treat current values greater than or equal to target as complete.

## Status Rule

Suggested derived status:

- `completed`: current value is greater than or equal to target value.
- `at-risk`: goal is incomplete and has a known blocker, failed test signal, or explicitly flagged risk.
- `active`: goal is incomplete and not currently at risk.

Dates are optional, so deadlines should not be required for deriving status.

## Initial Metrics

The first dashboard should model these QA metric categories:

- Unit tests passing.
- Unit test coverage.
- API tests passing.
- API test coverage.
- UI tests passing.
- UI test coverage.

Metric values can be mocked for the foundation and connected to repo analysis in `specs/004-repo-qa-metrics/`.

## UI Notes

- Show a dashboard summary at the top.
- Show goal rows or cards below the summary.
- Show whether each goal is a team goal or individual goal.
- Show the goal owner.
- Make status visually distinct.
- Keep the first version read-only.

## Testing Notes

- Unit test progress calculation.
- Unit test status calculation.
- Add a basic render test once the frontend framework is chosen.
