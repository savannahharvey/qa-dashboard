import fs from "node:fs";
import path from "node:path";
import type { Pool } from "pg";
import { getDatabaseUrl } from "../src/db/databaseUrl.js";
import { openPostgresPool } from "../src/db/postgres.js";

const databaseUrl = getDatabaseUrl();

async function applyPostgresSchema(pool: Pool) {
  await pool.query(fs.readFileSync(path.resolve(process.cwd(), "db/migrations/20260509125500_init/postgres.sql"), "utf8"));
}

function now() {
  return new Date().toISOString();
}

async function seedPostgres(pool: Pool) {
  await seed((sql, values) => pool.query(sql, values).then(() => undefined), postgresSql);
}

async function seed(run: (sql: string, values: unknown[]) => Promise<void>, sql: typeof postgresSql) {
  const timestamp = now();

  await run(sql.team, ["team-qa", "QA Dashboard Team", "QA-232", timestamp, timestamp]);

  const users = [
    ["user-sam", "sam", "Sam Rivera"],
    ["user-jordan", "jordan", "Jordan Lee"],
    ["user-mia", "mia", "Mia Chen"],
  ];

  for (const [id, username, displayName] of users) {
    await run(sql.user, [id, username, displayName, timestamp, timestamp]);
    await run(sql.membership, [id, "team-qa"]);
  }

  const testSuites = [
    ["suite-unit", "UNIT", "Unit tests"],
    ["suite-api", "API", "API tests"],
    ["suite-ui", "UI", "UI tests"],
  ];

  for (const [id, category, name] of testSuites) {
    await run(sql.testSuite, [id, "team-qa", category, name, "SAMPLE", true, timestamp, timestamp]);
  }

  const metrics = [
    ["metric-unit-passing", "suite-unit", "UNIT", "TESTS_PASSING", "PASSING", null, null],
    ["metric-unit-coverage", "suite-unit", "UNIT", "TEST_COVERAGE", null, 82, "%"],
    ["metric-api-passing", "suite-api", "API", "TESTS_PASSING", "PASSING", null, null],
    ["metric-api-coverage", "suite-api", "API", "TEST_COVERAGE", null, 74, "%"],
    ["metric-ui-passing", "suite-ui", "UI", "TESTS_PASSING", "FAILING", null, null],
    ["metric-ui-coverage", "suite-ui", "UI", "TEST_COVERAGE", null, 61, "%"],
  ];

  for (const [id, testSuiteId, category, kind, status, value, unit] of metrics) {
    await run(sql.metric, [id, "team-qa", testSuiteId, category, kind, status, value, unit, "SAMPLE", timestamp, timestamp]);
  }

  const goals = [
    ["goal-team-unit-coverage", "user-sam", "TEAM", null, "Reach 90% unit test coverage", "Improve unit coverage for core dashboard logic.", "TEST_COVERAGE", "UNIT", 82, 90, "%", "ACTIVE"],
    ["goal-team-api-tests", "user-jordan", "TEAM", null, "Keep API tests passing", "Maintain passing API coverage for backend-facing behavior.", "TESTS_PASSING", "API", 1, 1, null, "COMPLETED"],
    ["goal-team-ui-coverage", "user-mia", "TEAM", null, "Raise UI test coverage to 75%", "Improve browser-level confidence for primary dashboard flows.", "TEST_COVERAGE", "UI", 61, 75, "%", "AT_RISK"],
    ["goal-individual-progress-utils", "user-sam", "INDIVIDUAL", "goal-team-unit-coverage", "Test progress utility edge cases", "Cover zero targets, over-target values, and unavailable values.", "TEST_COVERAGE", "UNIT", 3, 4, null, "ACTIVE"],
    ["goal-individual-api-fixtures", "user-jordan", "INDIVIDUAL", "goal-team-api-tests", "Add API test fixtures", "Create reusable fixtures for API behavior tests.", "TESTS_PASSING", "API", 1, 1, null, "COMPLETED"],
    ["goal-individual-playwright-smoke", "user-mia", "INDIVIDUAL", "goal-team-ui-coverage", "Create dashboard Playwright smoke test", "Verify the signed-in dashboard flow and metric summary render.", "TEST_COVERAGE", "UI", 0, 1, null, "AT_RISK"],
  ];

  for (const [id, ownerId, scope, parentGoalId, title, description, metricType, testCategory, currentValue, targetValue, unit, status] of goals) {
    await run(sql.goal, [
      id,
      "team-qa",
      ownerId,
      scope,
      parentGoalId,
      title,
      description,
      metricType,
      testCategory,
      currentValue,
      targetValue,
      unit,
      status,
      timestamp,
      timestamp,
    ]);
  }

  await run(sql.metricSourceConfig, [
    "source-config-azure-devops",
    "team-qa",
    "AZURE_DEVOPS",
    JSON.stringify({
      organizationEnv: "AZURE_DEVOPS_ORG",
      projectEnv: "AZURE_DEVOPS_PROJECT",
      categoryMap: {
        unit: { runTitleIncludes: "unit" },
        api: { runTitleIncludes: "api" },
        ui: { runTitleIncludes: "ui" },
      },
    }),
    false,
    timestamp,
    timestamp,
  ]);
}

const postgresSql = {
  team: `INSERT INTO "Team" ("id", "name", "joinCode", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ("id") DO UPDATE SET "name" = excluded."name", "joinCode" = excluded."joinCode", "updatedAt" = excluded."updatedAt"`,
  user: `INSERT INTO "User" ("id", "username", "displayName", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("id") DO UPDATE SET "username" = excluded."username", "displayName" = excluded."displayName", "updatedAt" = excluded."updatedAt"`,
  membership: `INSERT INTO "TeamMembership" ("userId", "teamId")
       VALUES ($1, $2)
       ON CONFLICT ("userId", "teamId") DO NOTHING`,
  testSuite: `INSERT INTO "TestSuite" ("id", "teamId", "category", "name", "source", "enabled", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("id") DO UPDATE SET "name" = excluded."name", "source" = excluded."source", "enabled" = excluded."enabled", "updatedAt" = excluded."updatedAt"`,
  metric: `INSERT INTO "QaMetric" ("id", "teamId", "testSuiteId", "category", "kind", "status", "value", "unit", "source", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT ("id") DO UPDATE SET "status" = excluded."status", "value" = excluded."value", "unit" = excluded."unit", "source" = excluded."source", "updatedAt" = excluded."updatedAt"`,
  goal: `INSERT INTO "Goal" ("id", "teamId", "ownerId", "scope", "parentGoalId", "title", "description", "metricType", "testCategory", "currentValue", "targetValue", "unit", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT ("id") DO UPDATE SET "currentValue" = excluded."currentValue", "targetValue" = excluded."targetValue", "status" = excluded."status", "updatedAt" = excluded."updatedAt"`,
  metricSourceConfig: `INSERT INTO "MetricSourceConfig" ("id", "teamId", "source", "settings", "enabled", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("teamId", "source") DO UPDATE SET "settings" = excluded."settings", "enabled" = excluded."enabled", "updatedAt" = excluded."updatedAt"`,
};

// const pool = openPostgresPool(databaseUrl);
// Comment out the old dynamic fetching line:
// const pool = openPostgresPool(databaseUrl);

// Add this temporary hardcoded line using the root 'postgres' user:
// const pool = openPostgresPool("postgresql://postgres:wPmQF94wJE-Pt8c737ZY@127.0.0.1:5433/qa_dashboard?sslmode=no-verify");
const pool = openPostgresPool("postgresql://qa_admin:wPmQF94wJE-Pt8c737ZY@127.0.0.1:5999/qa_dashboard?sslmode=no-verify");

try {
  await applyPostgresSchema(pool);
  await seedPostgres(pool);
  console.log("PostgreSQL database initialized with QA dashboard sample data.");
} finally {
  await pool.end();
}
