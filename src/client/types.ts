export type User = {
  id: string;
  username: string;
  displayName: string | null;
};

export type Team = {
  id: string;
  name: string;
  joinCode?: string | null;
};

export type MetricStatus = "passing" | "failing" | "unavailable";
export type MetricKind = "tests-passing" | "test-coverage";
export type TestCategory = "unit" | "api" | "ui";
export type GoalScope = "team" | "individual";
export type GoalStatus = "active" | "completed" | "at-risk";

export type QaMetric = {
  id: string;
  teamId: string;
  testSuiteId?: string | null;
  category: TestCategory;
  kind: MetricKind;
  status?: MetricStatus;
  value?: number;
  unit?: string | null;
  source: "sample" | "manual" | "azure-devops";
  measuredAt?: string;
};

export type GoalProgress = {
  available: boolean;
  currentValue?: number;
  targetValue?: number;
  percentage?: number;
  complete?: boolean;
};

export type Goal = {
  id: string;
  teamId: string;
  ownerId: string;
  ownerName?: string;
  scope: GoalScope;
  parentGoalId?: string | null;
  title: string;
  description?: string | null;
  metricType?: MetricKind | null;
  testCategory?: TestCategory | null;
  currentValue: number;
  targetValue: number;
  unit?: string | null;
  dueDate?: string;
  status: GoalStatus;
  progress?: GoalProgress;
};

export type Dashboard = {
  team: Team;
  testSuites: Array<{
    id: string;
    category: TestCategory;
    name: string;
    enabled: boolean;
    source: string;
  }>;
  metrics: QaMetric[];
  goals: Goal[];
};

export type GoalInput = {
  title: string;
  description: string | null;
  scope: GoalScope;
  ownerId: string;
  parentGoalId: string | null;
  metricType: MetricKind | null;
  testCategory: TestCategory | null;
  currentValue: number;
  targetValue: number;
  unit: string | null;
  dueDate: string | null;
};
