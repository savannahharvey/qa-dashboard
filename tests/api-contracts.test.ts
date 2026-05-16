import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

let app: Awaited<ReturnType<typeof import("../src/app.js").createApp>>;
let db: DatabaseSync;

beforeAll(async () => {
  const databasePath = path.join(os.tmpdir(), `qa-dashboard-api-${Date.now()}.db`);
  process.env.DATABASE_URL = `file:${databasePath}`;
  process.env.NODE_ENV = "test";

  db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(fs.readFileSync(path.resolve(process.cwd(), "db/migrations/20260509125500_init/migration.sql"), "utf8"));
  seedTeam();
  seedDashboardFixture();

  app = (await import("../src/app.js")).createApp();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.AZURE_DEVOPS_ORG;
  delete process.env.AZURE_DEVOPS_PROJECT;
  delete process.env.AZURE_DEVOPS_PAT;
});

describe("auth API contracts", () => {
  it("signs up users, starts a session, and rejects duplicate usernames", async () => {
    const agent = request.agent(app);

    const response = await agent
      .post("/api/auth/sign-up")
      .send({ username: "sam", password: "password123", displayName: "Sam" })
      .expect(201);

    expect(response.headers["set-cookie"][0]).toContain("qa_dashboard_session");
    expect(response.body.user).toMatchObject({ username: "sam", displayName: "Sam" });
    expect(response.body.user.passwordHash).toBeUndefined();

    await agent.post("/api/auth/sign-up").send({ username: "SAM", password: "password123" }).expect(409);
  });

  it("signs in with valid credentials and rejects invalid credentials", async () => {
    await request(app).post("/api/auth/sign-up").send({ username: "jordan", password: "password123" }).expect(201);

    await request(app).post("/api/auth/sign-in").send({ username: "jordan", password: "wrong-password" }).expect(401);

    const response = await request(app).post("/api/auth/sign-in").send({ username: "jordan", password: "password123" }).expect(200);
    expect(response.body.user).toMatchObject({ username: "jordan" });
    expect(response.body.teams).toEqual([]);
  });

  it("returns the current user and clears sessions on sign-out", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/sign-up").send({ username: "mia", password: "password123" }).expect(201);

    await agent.get("/api/auth/me").expect(200);
    await agent.post("/api/auth/sign-out").expect(204);
    await agent.get("/api/auth/me").expect(401);
    await agent.post("/api/teams/join").send({ joinCode: "QA-232" }).expect(401);
  });
});

describe("team membership and protected routes", () => {
  it("requires authentication for protected team actions", async () => {
    await request(app).post("/api/teams/team-qa/goals").send({}).expect(401);
  });

  it("joins a team by code and treats duplicate joins as success", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/sign-up").send({ username: "alex", password: "password123" }).expect(201);

    await agent.post("/api/teams/join").send({ joinCode: "NOPE" }).expect(404);
    const firstJoin = await agent.post("/api/teams/join").send({ joinCode: "QA-232" }).expect(200);
    const secondJoin = await agent.post("/api/teams/join").send({ joinCode: "QA-232" }).expect(200);

    expect(firstJoin.body.team).toEqual({ id: "team-qa", name: "QA Dashboard Team" });
    expect(secondJoin.body.team).toEqual(firstJoin.body.team);
  });

  it("returns 403 when a signed-in non-member writes to a team", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/sign-up").send({ username: "taylor", password: "password123" }).expect(201);

    await agent.post("/api/teams/team-qa/goals").send(validGoalBody("unused")).expect(403);
  });
});

describe("dashboard read API scenarios", () => {
  it("reports service health", async () => {
    await request(app).get("/health").expect(200, { ok: true, service: "qa-dashboard-api" });
  });

  it("returns a complete dashboard view for an existing team", async () => {
    const response = await request(app).get("/api/teams/team-qa/dashboard").expect(200);

    expect(response.body.team).toEqual({
      id: "team-qa",
      name: "QA Dashboard Team",
      joinCode: "QA-232",
    });
    expect(response.body.testSuites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "suite-api", category: "api", enabled: true, source: "sample" }),
        expect.objectContaining({ id: "suite-ui", category: "ui", enabled: true, source: "sample" }),
        expect.objectContaining({ id: "suite-unit", category: "unit", enabled: true, source: "sample" }),
      ]),
    );
    expect(response.body.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "api", kind: "test-coverage", value: 74, unit: "%" }),
        expect.objectContaining({ category: "ui", kind: "tests-passing", status: "failing" }),
        expect.objectContaining({ category: "unit", kind: "tests-passing", status: "passing" }),
      ]),
    );
    expect(response.body.goals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "goal-fixture-api-tests",
          ownerName: "Fixture Jordan",
          status: "completed",
          progress: expect.objectContaining({ available: true, complete: true }),
        }),
      ]),
    );
  });

  it("returns focused metrics, goals, and test suite resources", async () => {
    const metrics = await request(app).get("/api/teams/team-qa/metrics").expect(200);
    const goals = await request(app).get("/api/teams/team-qa/goals").expect(200);
    const testSuites = await request(app).get("/api/teams/team-qa/test-suites").expect(200);

    expect(metrics.body.metrics).toHaveLength(6);
    expect(goals.body.goals).toHaveLength(3);
    expect(testSuites.body.testSuites).toHaveLength(3);
    expect(testSuites.body.testSuites[0]).toMatchObject({ teamId: "team-qa", category: "api" });
  });

  it("handles unknown routes and teams predictably", async () => {
    await request(app).get("/api/nope").expect(404, { error: "Not found" });
    await request(app).get("/api/teams/missing/dashboard").expect(404, { error: "Team not found" });

    const metrics = await request(app).get("/api/teams/missing/metrics").expect(200);
    const goals = await request(app).get("/api/teams/missing/goals").expect(200);
    const testSuites = await request(app).get("/api/teams/missing/test-suites").expect(200);

    expect(metrics.body.metrics).toEqual([]);
    expect(goals.body.goals).toEqual([]);
    expect(testSuites.body.testSuites).toEqual([]);
  });
});

describe("goal creation API contracts", () => {
  it("creates team goals and individual goals with a parent team goal", async () => {
    const agent = request.agent(app);
    const signUp = await agent.post("/api/auth/sign-up").send({ username: "casey", password: "password123" }).expect(201);
    await agent.post("/api/teams/join").send({ joinCode: "QA-232" }).expect(200);

    const teamGoal = await agent.post("/api/teams/team-qa/goals").send(validGoalBody(signUp.body.user.id)).expect(201);
    expect(teamGoal.body.goal).toMatchObject({ scope: "team", metricType: "tests-passing", testCategory: "api" });

    const individualGoal = await agent
      .post("/api/teams/team-qa/goals")
      .send({ ...validGoalBody(signUp.body.user.id), scope: "individual", parentGoalId: teamGoal.body.goal.id })
      .expect(201);

    expect(individualGoal.body.goal).toMatchObject({ scope: "individual", parentGoalId: teamGoal.body.goal.id });
  });

  it("returns field-level validation errors for invalid goals", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/sign-up").send({ username: "riley", password: "password123" }).expect(201);
    await agent.post("/api/teams/join").send({ joinCode: "QA-232" }).expect(200);

    const response = await agent.post("/api/teams/team-qa/goals").send({ title: "", scope: "team" }).expect(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
      fields: {
        title: expect.any(String),
        ownerId: expect.any(String),
        currentValue: expect.any(String),
        targetValue: expect.any(String),
      },
    });
  });
});

describe("Azure DevOps metric refresh API contracts", () => {
  it("returns stable unavailable metrics when Azure config is missing", async () => {
    const agent = await signedInMember("azuremissing");

    const response = await agent.post("/api/teams/team-qa/metrics/refresh").send({ source: "azure-devops" }).expect(200);

    expect(response.body.source).toBe("azure-devops");
    expect(response.body.metrics).toHaveLength(6);
    expect(response.body.metrics[0].status).toBe("unavailable");
    expect(response.body.diagnostics[0].message).not.toContain("AZURE_DEVOPS_PAT");
  });

  it("normalizes successful Azure test results and persists refreshed metrics", async () => {
    enableAzureConfig();
    process.env.AZURE_DEVOPS_ORG = "org";
    process.env.AZURE_DEVOPS_PROJECT = "project";
    process.env.AZURE_DEVOPS_PAT = "secret-token";
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : "url" in input ? input.url : String(input);
      if (url.includes("/_apis/test/runs?")) {
        return jsonResponse({
          value: [
            { id: 1, name: "unit tests" },
            { id: 2, name: "api tests" },
            { id: 3, name: "ui tests" },
          ],
        });
      }

      if (url.includes("/runs/3/results")) {
        return jsonResponse({ value: [{ outcome: "Failed" }] });
      }

      if (url.includes("/results?")) {
        return jsonResponse({ value: [{ outcome: "Passed" }, { outcome: "Passed" }] });
      }

      return { ok: false, json: async () => ({}) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    const agent = await signedInMember("azuresuccess");

    const response = await agent.post("/api/teams/team-qa/metrics/refresh").send({ source: "azure-devops" }).expect(200);

    expect(fetchMock).toHaveBeenCalled();
    expect(response.body.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "unit", kind: "tests-passing", status: "passing" }),
        expect.objectContaining({ category: "ui", kind: "tests-passing", status: "failing" }),
      ]),
    );
    expect(JSON.stringify(response.body)).not.toContain("secret-token");
    expect(db.prepare("SELECT COUNT(*) AS count FROM QaMetric WHERE source = 'AZURE_DEVOPS'").get()).toMatchObject({ count: 6 });
  });

  it("returns unavailable metrics when Azure requests fail", async () => {
    enableAzureConfig();
    process.env.AZURE_DEVOPS_ORG = "org";
    process.env.AZURE_DEVOPS_PROJECT = "project";
    process.env.AZURE_DEVOPS_PAT = "secret-token";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ message: "nope" }) }) as Response));
    const agent = await signedInMember("azurefailure");

    const response = await agent.post("/api/teams/team-qa/metrics/refresh").send({ source: "azure-devops" }).expect(200);

    expect(response.body.metrics).toHaveLength(6);
    expect(response.body.metrics.every((metric: { status?: string }) => metric.status === "unavailable")).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain("secret-token");
  });

  it("validates unsupported refresh sources", async () => {
    const agent = await signedInMember("azuresource");
    await agent.post("/api/teams/team-qa/metrics/refresh").send({ source: "manual" }).expect(400);
  });
});

function seedTeam() {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO Team (id, name, joinCode, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)`,
  ).run("team-qa", "QA Dashboard Team", "QA-232", now, now);
}

function seedDashboardFixture() {
  const now = new Date().toISOString();
  const users = [
    ["user-fixture-sam", "fixture-sam", "Fixture Sam"],
    ["user-fixture-jordan", "fixture-jordan", "Fixture Jordan"],
    ["user-fixture-mia", "fixture-mia", "Fixture Mia"],
  ];

  for (const [id, username, displayName] of users) {
    db.prepare(
      `INSERT INTO User (id, username, displayName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, username, displayName, now, now);
    db.prepare(
      `INSERT INTO TeamMembership (userId, teamId)
       VALUES (?, ?)`,
    ).run(id, "team-qa");
  }

  const testSuites = [
    ["suite-unit", "UNIT", "Unit tests"],
    ["suite-api", "API", "API tests"],
    ["suite-ui", "UI", "UI tests"],
  ];

  for (const [id, category, name] of testSuites) {
    db.prepare(
      `INSERT INTO TestSuite (id, teamId, category, name, source, enabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, "team-qa", category, name, "SAMPLE", 1, now, now);
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
    db.prepare(
      `INSERT INTO QaMetric (id, teamId, testSuiteId, category, kind, status, value, unit, source, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, "team-qa", testSuiteId, category, kind, status, value, unit, "SAMPLE", now, now);
  }

  const goals = [
    [
      "goal-fixture-unit-coverage",
      "user-fixture-sam",
      "TEAM",
      "Reach 90% unit test coverage",
      "TEST_COVERAGE",
      "UNIT",
      82,
      90,
      "%",
      "ACTIVE",
    ],
    [
      "goal-fixture-api-tests",
      "user-fixture-jordan",
      "TEAM",
      "Keep API tests passing",
      "TESTS_PASSING",
      "API",
      1,
      1,
      null,
      "ACTIVE",
    ],
    [
      "goal-fixture-ui-coverage",
      "user-fixture-mia",
      "TEAM",
      "Raise UI test coverage to 75%",
      "TEST_COVERAGE",
      "UI",
      61,
      75,
      "%",
      "AT_RISK",
    ],
  ];

  for (const [id, ownerId, scope, title, metricType, testCategory, currentValue, targetValue, unit, status] of goals) {
    db.prepare(
      `INSERT INTO Goal (
        id, teamId, ownerId, scope, parentGoalId, title, description, metricType, testCategory,
        currentValue, targetValue, unit, dueDate, status, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      "team-qa",
      ownerId,
      scope,
      null,
      title,
      null,
      metricType,
      testCategory,
      currentValue,
      targetValue,
      unit,
      null,
      status,
      now,
      now,
    );
  }
}

function enableAzureConfig() {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO MetricSourceConfig (id, teamId, source, settings, enabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(teamId, source) DO UPDATE SET enabled = excluded.enabled, updatedAt = excluded.updatedAt`,
  ).run(
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
    1,
    now,
    now,
  );
}

async function signedInMember(username: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/sign-up").send({ username, password: "password123" }).expect(201);
  await agent.post("/api/teams/join").send({ joinCode: "QA-232" }).expect(200);
  return agent;
}

function validGoalBody(ownerId: string) {
  return {
    title: "Keep API tests passing",
    description: "Maintain passing API coverage.",
    scope: "team",
    ownerId,
    parentGoalId: null,
    metricType: "tests-passing",
    testCategory: "api",
    currentValue: 1,
    targetValue: 1,
    unit: "state",
    dueDate: null,
  };
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}
