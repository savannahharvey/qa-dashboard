# Sample Data

This file defines the planning fixture data for the first implementation. It is not production data, and it should be copied into app source only when implementation begins.

## Users

```ts
const users = [
  {
    id: "user-sam",
    username: "sam",
    displayName: "Sam Rivera"
  },
  {
    id: "user-jordan",
    username: "jordan",
    displayName: "Jordan Lee"
  },
  {
    id: "user-mia",
    username: "mia",
    displayName: "Mia Chen"
  }
];
```

## Teams

```ts
const teams = [
  {
    id: "team-qa",
    name: "QA Dashboard Team",
    joinCode: "QA-232"
  }
];
```

## Team Memberships

```ts
const teamMemberships = [
  { userId: "user-sam", teamId: "team-qa" },
  { userId: "user-jordan", teamId: "team-qa" },
  { userId: "user-mia", teamId: "team-qa" }
];
```

## QA Metrics

```ts
const qaMetrics = [
  {
    id: "metric-unit-passing",
    teamId: "team-qa",
    category: "unit",
    kind: "tests-passing",
    status: "passing",
    source: "sample"
  },
  {
    id: "metric-unit-coverage",
    teamId: "team-qa",
    category: "unit",
    kind: "test-coverage",
    value: 82,
    unit: "%",
    source: "sample"
  },
  {
    id: "metric-api-passing",
    teamId: "team-qa",
    category: "api",
    kind: "tests-passing",
    status: "passing",
    source: "sample"
  },
  {
    id: "metric-api-coverage",
    teamId: "team-qa",
    category: "api",
    kind: "test-coverage",
    value: 74,
    unit: "%",
    source: "sample"
  },
  {
    id: "metric-ui-passing",
    teamId: "team-qa",
    category: "ui",
    kind: "tests-passing",
    status: "failing",
    source: "sample"
  },
  {
    id: "metric-ui-coverage",
    teamId: "team-qa",
    category: "ui",
    kind: "test-coverage",
    value: 61,
    unit: "%",
    source: "sample"
  }
];
```

## Goals

```ts
const goals = [
  {
    id: "goal-team-unit-coverage",
    teamId: "team-qa",
    ownerId: "user-sam",
    ownerName: "Sam Rivera",
    scope: "team",
    title: "Reach 90% unit test coverage",
    description: "Improve unit coverage for core dashboard logic.",
    metricType: "test-coverage",
    testCategory: "unit",
    currentValue: 82,
    targetValue: 90,
    unit: "%",
    status: "active"
  },
  {
    id: "goal-team-api-tests",
    teamId: "team-qa",
    ownerId: "user-jordan",
    ownerName: "Jordan Lee",
    scope: "team",
    title: "Keep API tests passing",
    description: "Maintain passing API coverage for backend-facing behavior.",
    metricType: "tests-passing",
    testCategory: "api",
    currentValue: 1,
    targetValue: 1,
    status: "completed"
  },
  {
    id: "goal-team-ui-coverage",
    teamId: "team-qa",
    ownerId: "user-mia",
    ownerName: "Mia Chen",
    scope: "team",
    title: "Raise UI test coverage to 75%",
    description: "Improve browser-level confidence for primary dashboard flows.",
    metricType: "test-coverage",
    testCategory: "ui",
    currentValue: 61,
    targetValue: 75,
    unit: "%",
    status: "at-risk"
  },
  {
    id: "goal-individual-progress-utils",
    teamId: "team-qa",
    ownerId: "user-sam",
    ownerName: "Sam Rivera",
    scope: "individual",
    parentGoalId: "goal-team-unit-coverage",
    title: "Test progress utility edge cases",
    description: "Cover zero targets, over-target values, and unavailable values.",
    metricType: "test-coverage",
    testCategory: "unit",
    currentValue: 3,
    targetValue: 4,
    status: "active"
  },
  {
    id: "goal-individual-api-fixtures",
    teamId: "team-qa",
    ownerId: "user-jordan",
    ownerName: "Jordan Lee",
    scope: "individual",
    parentGoalId: "goal-team-api-tests",
    title: "Add API test fixtures",
    description: "Create reusable fixtures for API behavior tests.",
    metricType: "tests-passing",
    testCategory: "api",
    currentValue: 1,
    targetValue: 1,
    status: "completed"
  },
  {
    id: "goal-individual-playwright-smoke",
    teamId: "team-qa",
    ownerId: "user-mia",
    ownerName: "Mia Chen",
    scope: "individual",
    parentGoalId: "goal-team-ui-coverage",
    title: "Create dashboard Playwright smoke test",
    description: "Verify the signed-in dashboard flow and metric summary render.",
    metricType: "test-coverage",
    testCategory: "ui",
    currentValue: 0,
    targetValue: 1,
    status: "at-risk"
  }
];
```
