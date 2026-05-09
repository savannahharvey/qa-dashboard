import fs from "node:fs";
import path from "node:path";
import { openDatabase } from "../src/db/sqlite.js";

const db = openDatabase();

function tableExists(tableName: string) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName));
}

function applySchema() {
  if (tableExists("Team")) {
    return;
  }

  const migrationPath = path.resolve(process.cwd(), "db/migrations/20260509125500_init/migration.sql");
  db.exec(fs.readFileSync(migrationPath, "utf8"));
}

function now() {
  return new Date().toISOString();
}

function upsert(sql: string, values: unknown[]) {
  db.prepare(sql).run(...values);
}

function seed() {
  const timestamp = now();

  upsert(
    `INSERT INTO Team (id, name, joinCode, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, joinCode = excluded.joinCode, updatedAt = excluded.updatedAt`,
    ["team-qa", "QA Dashboard Team", "QA-232", timestamp, timestamp],
  );

  const users = [
    ["user-sam", "sam", "Sam Rivera"],
    ["user-jordan", "jordan", "Jordan Lee"],
    ["user-mia", "mia", "Mia Chen"],
  ];

  for (const [id, username, displayName] of users) {
    upsert(
      `INSERT INTO User (id, username, displayName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET username = excluded.username, displayName = excluded.displayName, updatedAt = excluded.updatedAt`,
      [id, username, displayName, timestamp, timestamp],
    );

    upsert(
      `INSERT INTO TeamMembership (userId, teamId)
       VALUES (?, ?)
       ON CONFLICT(userId, teamId) DO NOTHING`,
      [id, "team-qa"],
    );
  }

  const testSuites = [
    ["suite-unit", "UNIT", "Unit tests"],
    ["suite-api", "API", "API tests"],
    ["suite-ui", "UI", "UI tests"],
  ];

  for (const [id, category, name] of testSuites) {
    upsert(
      `INSERT INTO TestSuite (id, teamId, category, name, source, enabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, source = excluded.source, enabled = excluded.enabled, updatedAt = excluded.updatedAt`,
      [id, "team-qa", category, name, "SAMPLE", 1, timestamp, timestamp],
    );
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
    upsert(
      `INSERT INTO QaMetric (id, teamId, testSuiteId, category, kind, status, value, unit, source, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET status = excluded.status, value = excluded.value, unit = excluded.unit, source = excluded.source, updatedAt = excluded.updatedAt`,
      [id, "team-qa", testSuiteId, category, kind, status, value, unit, "SAMPLE", timestamp, timestamp],
    );
  }

  const goals = [
    [
      "goal-team-unit-coverage",
      "user-sam",
      "TEAM",
      null,
      "Reach 90% unit test coverage",
      "Improve unit coverage for core dashboard logic.",
      "TEST_COVERAGE",
      "UNIT",
      82,
      90,
      "%",
      "ACTIVE",
    ],
    [
      "goal-team-api-tests",
      "user-jordan",
      "TEAM",
      null,
      "Keep API tests passing",
      "Maintain passing API coverage for backend-facing behavior.",
      "TESTS_PASSING",
      "API",
      1,
      1,
      null,
      "COMPLETED",
    ],
    [
      "goal-team-ui-coverage",
      "user-mia",
      "TEAM",
      null,
      "Raise UI test coverage to 75%",
      "Improve browser-level confidence for primary dashboard flows.",
      "TEST_COVERAGE",
      "UI",
      61,
      75,
      "%",
      "AT_RISK",
    ],
    [
      "goal-individual-progress-utils",
      "user-sam",
      "INDIVIDUAL",
      "goal-team-unit-coverage",
      "Test progress utility edge cases",
      "Cover zero targets, over-target values, and unavailable values.",
      "TEST_COVERAGE",
      "UNIT",
      3,
      4,
      null,
      "ACTIVE",
    ],
    [
      "goal-individual-api-fixtures",
      "user-jordan",
      "INDIVIDUAL",
      "goal-team-api-tests",
      "Add API test fixtures",
      "Create reusable fixtures for API behavior tests.",
      "TESTS_PASSING",
      "API",
      1,
      1,
      null,
      "COMPLETED",
    ],
    [
      "goal-individual-playwright-smoke",
      "user-mia",
      "INDIVIDUAL",
      "goal-team-ui-coverage",
      "Create dashboard Playwright smoke test",
      "Verify the signed-in dashboard flow and metric summary render.",
      "TEST_COVERAGE",
      "UI",
      0,
      1,
      null,
      "AT_RISK",
    ],
  ];

  for (const [id, ownerId, scope, parentGoalId, title, description, metricType, testCategory, currentValue, targetValue, unit, status] of goals) {
    upsert(
      `INSERT INTO Goal (id, teamId, ownerId, scope, parentGoalId, title, description, metricType, testCategory, currentValue, targetValue, unit, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET currentValue = excluded.currentValue, targetValue = excluded.targetValue, status = excluded.status, updatedAt = excluded.updatedAt`,
      [
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
      ],
    );
  }

  upsert(
    `INSERT INTO MetricSourceConfig (id, teamId, source, settings, enabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(teamId, source) DO UPDATE SET settings = excluded.settings, enabled = excluded.enabled, updatedAt = excluded.updatedAt`,
    [
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
      0,
      timestamp,
      timestamp,
    ],
  );
}

applySchema();
seed();
db.close();

console.log("SQLite database initialized with QA dashboard sample data.");
