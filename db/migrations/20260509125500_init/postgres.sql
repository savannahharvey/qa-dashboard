CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "joinCode" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "TeamMembership" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    PRIMARY KEY ("userId", "teamId"),
    CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TestSuite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SAMPLE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "TestSuite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "parentGoalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metricType" TEXT,
    "testCategory" TEXT,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "dueDate" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "Goal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_parentGoalId_fkey" FOREIGN KEY ("parentGoalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "QaMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "testSuiteId" TEXT,
    "category" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "source" TEXT NOT NULL,
    "measuredAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "QaMetric_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QaMetric_testSuiteId_fkey" FOREIGN KEY ("testSuiteId") REFERENCES "TestSuite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MetricSourceConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "MetricSourceConfig_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "Team_joinCode_key" ON "Team"("joinCode");
CREATE INDEX IF NOT EXISTS "TeamMembership_teamId_idx" ON "TeamMembership"("teamId");
CREATE INDEX IF NOT EXISTS "TestSuite_teamId_idx" ON "TestSuite"("teamId");
CREATE UNIQUE INDEX IF NOT EXISTS "TestSuite_teamId_category_key" ON "TestSuite"("teamId", "category");
CREATE INDEX IF NOT EXISTS "Goal_teamId_scope_idx" ON "Goal"("teamId", "scope");
CREATE INDEX IF NOT EXISTS "Goal_ownerId_idx" ON "Goal"("ownerId");
CREATE INDEX IF NOT EXISTS "Goal_parentGoalId_idx" ON "Goal"("parentGoalId");
CREATE INDEX IF NOT EXISTS "Goal_teamId_metricType_testCategory_idx" ON "Goal"("teamId", "metricType", "testCategory");
CREATE INDEX IF NOT EXISTS "QaMetric_teamId_category_kind_idx" ON "QaMetric"("teamId", "category", "kind");
CREATE INDEX IF NOT EXISTS "QaMetric_teamId_source_idx" ON "QaMetric"("teamId", "source");
CREATE INDEX IF NOT EXISTS "QaMetric_measuredAt_idx" ON "QaMetric"("measuredAt");
CREATE INDEX IF NOT EXISTS "MetricSourceConfig_teamId_idx" ON "MetricSourceConfig"("teamId");
CREATE UNIQUE INDEX IF NOT EXISTS "MetricSourceConfig_teamId_source_key" ON "MetricSourceConfig"("teamId", "source");

CREATE TABLE IF NOT EXISTS "TestMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repo" TEXT NOT NULL,
    "branch" TEXT,
    "period" TIMESTAMPTZ NOT NULL,
    "granularity" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS "TestMetric_repo_branch_period_idx" ON "TestMetric"("repo", "branch", "period");
