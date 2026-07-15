export type GoalScope = "TEAM" | "INDIVIDUAL";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "AT_RISK";
export type TestCategory = "UNIT" | "API" | "UI";
export type MetricKind = "TESTS_PASSING" | "TEST_COVERAGE";
export type MetricStatus = "PASSING" | "FAILING" | "UNAVAILABLE";
export type MetricSource = "MANUAL" | "AZURE_DEVOPS" | "GITHUB";

export type User = {
  id: string;
  username: string;
  displayName: string | null;
  passwordHash?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Team = {
  id: string;
  name: string;
  joinCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TestSuite = {
  id: string;
  teamId: string;
  category: TestCategory;
  name: string;
  source: MetricSource;
  enabled: number;
  createdAt: string;
  updatedAt: string;
};

export type Goal = {
  id: string;
  teamId: string;
  ownerId: string;
  scope: GoalScope;
  parentGoalId: string | null;
  title: string;
  description: string | null;
  metricType: MetricKind | null;
  testCategory: TestCategory | null;
  currentValue: number;
  targetValue: number;
  unit: string | null;
  dueDate: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
};

export type GoalWithOwner = Goal & {
  ownerUsername: string;
  ownerDisplayName: string | null;
};

export type QaMetric = {
  id: string;
  teamId: string;
  testSuiteId: string | null;
  category: TestCategory;
  kind: MetricKind;
  status: MetricStatus | null;
  value: number | null;
  unit: string | null;
  source: MetricSource;
  measuredAt: string | null;
  passedTests: number | null;
  failedTests: number | null;
  totalTests: number | null;
  createdAt: string;
  updatedAt: string;
};
