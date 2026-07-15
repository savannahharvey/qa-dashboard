import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { encryptPat } from "../src/services/patEncryption.js";

let app: Awaited<ReturnType<typeof import("../src/app.js").createApp>>;

// Create an in-memory repository used only for tests.
function createInMemoryRepository() {
  const users: any[] = [];
  const teams: any[] = [];
  const memberships: Array<{ userId: string; teamId: string }> = [];
  const testSuites: any[] = [];
  const metrics: any[] = [];
  const goals: any[] = [];
  const metricSourceConfigs: any[] = [];
  const testRunResults: any[] = [];
  const metricSnapshots: any[] = [];

  teams.push({ id: "team-qa", name: "QA Dashboard Team", joinCode: "QA-232" });

  return {
    async findTeam(teamId: string) {
      return teams.find((t) => t.id === teamId);
    },
    async findTeamByJoinCode(joinCode: string) {
      return teams.find((t) => t.joinCode === joinCode);
    },
    async findUser(userId: string) {
      return users.find((u) => u.id === userId);
    },
    async findUserByUsername(username: string) {
      return users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
    },
    async findMembership(userId: string, teamId: string) {
      return memberships.find((m) => m.userId === userId && m.teamId === teamId);
    },
    async findTeamsByUser(userId: string) {
      return memberships.filter((m) => m.userId === userId).map((m) => ({ id: m.teamId, name: "QA Dashboard Team" }));
    },
    async createUser(user: any) {
      users.push(user);
    },
    async createTeam(team: any) {
      teams.push(team);
    },
    async createMembership(userId: string, teamId: string) {
      if (!memberships.some((m) => m.userId === userId && m.teamId === teamId)) {
        memberships.push({ userId, teamId });
      }
    },
    async createGoal(goal: any) {
      goals.push(goal);
    },
    async findGoal(goalId: string) {
      return goals.find((g) => g.id === goalId);
    },
    async findMetricSourceConfig(teamId: string, source: string) {
      return metricSourceConfigs.find((c) => c.teamId === teamId && c.source === source);
    },
    async createMetricSourceConfig(cfg: any) {
      const existing = metricSourceConfigs.find((c) => c.teamId === cfg.teamId && c.source === cfg.source);
      if (existing) Object.assign(existing, cfg);
      else metricSourceConfigs.push(cfg);
    },
    async upsertMetricSourceConfig(teamId: string, source: string, settings: string, enabled: number | boolean) {
      const existing = metricSourceConfigs.find((c) => c.teamId === teamId && c.source === source);
      const now = new Date().toISOString();
      if (existing) {
        existing.settings = settings;
        existing.enabled = enabled;
        existing.updatedAt = now;
      } else {
        metricSourceConfigs.push({
          id: `source-config-${teamId}-${source}`,
          teamId,
          source,
          settings,
          enabled,
          encryptedPat: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    },
    async updateMetricSourcePat(teamId: string, source: string, encryptedPat: string | null) {
      const existing = metricSourceConfigs.find((c) => c.teamId === teamId && c.source === source);
      if (existing) existing.encryptedPat = encryptedPat;
    },
    async replaceTestRunResults(teamId: string, results: any[]) {
      for (let i = testRunResults.length - 1; i >= 0; i--) {
        if (testRunResults[i].teamId === teamId) testRunResults.splice(i, 1);
      }
      for (const r of results) testRunResults.push({ teamId, ...r });
    },
    async recordMetricSnapshot(teamId: string, passed: number, total: number) {
      metricSnapshots.push({ teamId, passed, total, recordedAt: new Date().toISOString() });
    },
    async replaceMetricsBySource(teamId: string, source: string, m: any[]) {
      for (let i = metrics.length - 1; i >= 0; i--) {
        if (metrics[i].teamId === teamId && metrics[i].source === source) metrics.splice(i, 1);
      }
      for (const mm of m) metrics.push(mm);
    },
    async findTestSuitesByTeam(teamId: string) {
      return testSuites
        .filter((s) => s.teamId === teamId)
        .sort((a, b) => String(a.category).toLowerCase().localeCompare(String(b.category).toLowerCase()));
    },
    async findMetricsByTeam(teamId: string) {
      return metrics.filter((m) => m.teamId === teamId);
    },
    async createTestSuite(s: any) {
      testSuites.push(s);
    },
    async createMetric(m: any) {
      metrics.push(m);
    },
    async findGoalsByTeam(teamId: string) {
      return goals
        .filter((g) => g.teamId === teamId)
        .map((g) => ({
          ...g,
          ownerUsername: users.find((u) => u.id === g.ownerId)?.username,
          ownerDisplayName: users.find((u) => u.id === g.ownerId)?.displayName,
        }));
    },
  } as const;
}

const inMemory = createInMemoryRepository();

vi.mock("../src/db/index.js", async () => ({
  repository: inMemory,
  closeDatabase: async () => {},
}));

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.ENCRYPTION_KEY = "1".repeat(64);
  // seed via helper functions below using the mocked repository
  seedTeam();
  seedDashboardFixture();

  app = (await import("../src/app.js")).createApp();
});

afterEach(async () => {
  vi.restoreAllMocks();
  // Azure auth is per-team only; reset the shared config between tests so state never leaks.
  await inMemory.upsertMetricSourceConfig("team-qa", "AZURE_DEVOPS", JSON.stringify({}), 0);
  await inMemory.updateMetricSourcePat("team-qa", "AZURE_DEVOPS", null);
});

afterAll(async () => {
  const { closeDatabase } = await import("../src/db/index.js");
  await closeDatabase();
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

  it("creates a team and adds the current user as a member", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/sign-up").send({ username: "alex-creator", password: "password123" }).expect(201);

    const response = await agent.post("/api/teams/create").send({ teamName: "New Team" }).expect(200);

    expect(response.body.team).toMatchObject({ name: "New Team" });
    expect(response.body.team.joinCode).toEqual(expect.any(String));

    const dashboard = await agent.get(`/api/teams/${response.body.team.id}/dashboard`).expect(200);
    expect(dashboard.body.team.id).toBe(response.body.team.id);
  });

  it("joins a team by code and treats duplicate joins as success", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/sign-up").send({ username: "alex-joiner", password: "password123" }).expect(201);

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
        expect.objectContaining({ id: "suite-api", category: "api", enabled: true, source: "manual" }),
        expect.objectContaining({ id: "suite-ui", category: "ui", enabled: true, source: "manual" }),
        expect.objectContaining({ id: "suite-unit", category: "unit", enabled: true, source: "manual" }),
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
  it("returns the saved Azure DevOps metric source config", async () => {
    enableAzureConfig();
    const agent = await signedInMember("azureconfigread");

    const response = await agent.get("/api/teams/team-qa/metrics/config").expect(200);

    expect(response.body.config).toEqual(
      expect.objectContaining({
        source: "AZURE_DEVOPS",
        enabled: true,
        settings: expect.objectContaining({
          organization: "org",
          project: "project",
        }),
      }),
    );
  });

  it("hides seeded mock metrics and suites when Azure is enabled", async () => {
    enableAzureConfig();
    const agent = await signedInMember("azureonly");

    const dashboard = await agent.get("/api/teams/team-qa/dashboard").expect(200);

    expect(dashboard.body.metrics).toEqual([]);
    expect(dashboard.body.testSuites).toEqual([]);
  });

  it("returns Azure build definitions for the current team", async () => {
    enableAzureConfig();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = typeof input === "string" ? input : "url" in input ? input.url : String(input);
        if (url.includes("/_apis/build/definitions?")) {
          return jsonResponse({
            value: [
              { id: 11, name: "Nightly Pipeline" },
              { id: 7, name: "PR Validation", path: "\\CI" },
            ],
          });
        }

        return { ok: false, json: async () => ({}) } as Response;
      }),
    );

    const agent = await signedInMember("azurepipelines");
    const response = await agent.get("/api/teams/team-qa/metrics/azure/pipelines").expect(200);

    expect(response.body.pipelines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 11, name: "Nightly Pipeline" }),
        expect.objectContaining({ id: 7, name: "PR Validation" }),
      ]),
    );
  });

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
    const allMetrics = await inMemory.findMetricsByTeam("team-qa");
    expect(allMetrics.filter((m) => m.source === "AZURE_DEVOPS")).toHaveLength(6);
  });

  it("prefers the configured build definition when matching Azure runs", async () => {
    enableAzureConfig(
      { buildDefinitionId: 2 },
      {
        unit: "shared",
        api: "shared",
        ui: "shared",
      },
    );
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : "url" in input ? input.url : String(input);
      if (url.includes("/_apis/test/runs?")) {
        return jsonResponse({
          value: [
            { id: 1, name: "shared pipeline", buildConfiguration: { buildDefinitionId: 1 } },
            { id: 2, name: "shared pipeline", buildConfiguration: { buildDefinitionId: 2 } },
          ],
        });
      }

      if (url.includes("/runs/2/results")) {
        return jsonResponse({ value: [{ outcome: "Passed" }] });
      }

      return { ok: false, json: async () => ({}) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    const agent = await signedInMember("azurebuildid");

    const response = await agent.post("/api/teams/team-qa/metrics/refresh").send({ source: "azure-devops" }).expect(200);

    expect(response.body.metrics).toEqual(
      expect.arrayContaining([expect.objectContaining({ category: "unit", status: "passing" })]),
    );
  });

  it("returns unavailable metrics when Azure requests fail", async () => {
    enableAzureConfig();
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

  it("stores, replaces, and clears a team's Azure DevOps PAT without ever returning it in plaintext", async () => {
    const agent = await signedInMember("azurepatlifecycle");
    const configBody = {
      source: "AZURE_DEVOPS",
      enabled: true,
      settings: {
        organization: "org",
        project: "project",
        categoryMap: {
          unit: { runTitleIncludes: "unit" },
          api: { runTitleIncludes: "api" },
          ui: { runTitleIncludes: "ui" },
        },
      },
    };

    await agent.post("/api/teams/team-qa/metrics/config").send({ ...configBody, pat: "first-pat" }).expect(200);
    const afterFirstSave = await agent.get("/api/teams/team-qa/metrics/config").expect(200);
    expect(afterFirstSave.body.config.hasPat).toBe(true);
    expect(JSON.stringify(afterFirstSave.body)).not.toContain("first-pat");

    await agent.post("/api/teams/team-qa/metrics/config").send({ ...configBody, pat: "second-pat" }).expect(200);
    const afterReplace = await agent.get("/api/teams/team-qa/metrics/config").expect(200);
    expect(afterReplace.body.config.hasPat).toBe(true);
    expect(JSON.stringify(afterReplace.body)).not.toContain("second-pat");

    await agent.post("/api/teams/team-qa/metrics/config").send({ ...configBody, pat: "" }).expect(200);
    const afterClear = await agent.get("/api/teams/team-qa/metrics/config").expect(200);
    expect(afterClear.body.config.hasPat).toBe(false);
  });

  it("saving settings without a pat field leaves a previously stored PAT untouched", async () => {
    const agent = await signedInMember("azurepatpreserve");
    const configBody = {
      source: "AZURE_DEVOPS",
      enabled: true,
      settings: {
        organization: "org",
        project: "project",
        categoryMap: {
          unit: { runTitleIncludes: "unit" },
          api: { runTitleIncludes: "api" },
          ui: { runTitleIncludes: "ui" },
        },
      },
    };

    await agent.post("/api/teams/team-qa/metrics/config").send({ ...configBody, pat: "stays-set" }).expect(200);
    await agent.post("/api/teams/team-qa/metrics/config").send(configBody).expect(200);

    const response = await agent.get("/api/teams/team-qa/metrics/config").expect(200);
    expect(response.body.config.hasPat).toBe(true);

    await inMemory.updateMetricSourcePat("team-qa", "AZURE_DEVOPS", null);
  });

  it("uses the team's stored PAT for auth when syncing", async () => {
    const agent = await signedInMember("azurepatpreference");

    await agent
      .post("/api/teams/team-qa/metrics/config")
      .send({
        source: "AZURE_DEVOPS",
        enabled: true,
        settings: {
          organization: "org",
          project: "project",
          categoryMap: {
            unit: { runTitleIncludes: "unit" },
            api: { runTitleIncludes: "api" },
            ui: { runTitleIncludes: "ui" },
          },
        },
        pat: "team-pat",
      })
      .expect(200);

    let capturedAuth: string | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        capturedAuth = (init?.headers as Record<string, string> | undefined)?.Authorization;
        return { ok: false, json: async () => ({}) } as Response;
      }),
    );

    await agent.post("/api/teams/team-qa/metrics/refresh").send({ source: "azure-devops" }).expect(200);

    expect(capturedAuth).toBe(`Basic ${Buffer.from(":team-pat").toString("base64")}`);

    await inMemory.updateMetricSourcePat("team-qa", "AZURE_DEVOPS", null);
  });

  it("uses the team's stored PAT for auth when listing pipelines", async () => {
    const agent = await signedInMember("azurepipelinespatpreference");

    await agent
      .post("/api/teams/team-qa/metrics/config")
      .send({
        source: "AZURE_DEVOPS",
        enabled: true,
        settings: {
          organization: "org",
          project: "project",
          categoryMap: {
            unit: { runTitleIncludes: "unit" },
            api: { runTitleIncludes: "api" },
            ui: { runTitleIncludes: "ui" },
          },
        },
        pat: "team-pat",
      })
      .expect(200);

    let capturedAuth: string | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        capturedAuth = (init?.headers as Record<string, string> | undefined)?.Authorization;
        return jsonResponse({ value: [] });
      }),
    );

    await agent.get("/api/teams/team-qa/metrics/azure/pipelines").expect(200);

    expect(capturedAuth).toBe(`Basic ${Buffer.from(":team-pat").toString("base64")}`);

    await inMemory.updateMetricSourcePat("team-qa", "AZURE_DEVOPS", null);
  });

  it("returns unavailable metrics without calling Azure when a team has no stored PAT", async () => {
    enableAzureConfig();
    await inMemory.updateMetricSourcePat("team-qa", "AZURE_DEVOPS", null);
    const agent = await signedInMember("azurepatfallback");

    const fetchMock = vi.fn(async () => ({ ok: false, json: async () => ({}) }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await agent.post("/api/teams/team-qa/metrics/refresh").send({ source: "azure-devops" }).expect(200);

    // Without a PAT there is no way to authenticate, so we never reach out to Azure.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.body.metrics).toHaveLength(6);
    expect(response.body.metrics.every((metric: { status?: string }) => metric.status === "unavailable")).toBe(true);
  });
});

function seedTeam() {
  // team already seeded in the in-memory repository during creation
}

function seedDashboardFixture() {
  const now = new Date().toISOString();
  const users = [
    ["user-fixture-sam", "fixture-sam", "Fixture Sam"],
    ["user-fixture-jordan", "fixture-jordan", "Fixture Jordan"],
    ["user-fixture-mia", "fixture-mia", "Fixture Mia"],
  ];

  for (const [id, username, displayName] of users) {
    inMemory.createUser({ id, username, displayName, createdAt: now, updatedAt: now });
    inMemory.createMembership(id, "team-qa");
  }

  const testSuites = [
    ["suite-unit", "UNIT", "Unit tests"],
    ["suite-api", "API", "API tests"],
    ["suite-ui", "UI", "UI tests"],
  ];

  for (const [id, category, name] of testSuites) {
    inMemory.createTestSuite({ id, teamId: "team-qa", category, name, source: "MANUAL", enabled: true, createdAt: now, updatedAt: now });
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
    inMemory.createMetric({ id, teamId: "team-qa", testSuiteId, category, kind, status, value, unit, source: "MANUAL", createdAt: now, updatedAt: now });
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
      "COMPLETED",
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
    inMemory.createGoal({
      id,
      teamId: "team-qa",
      ownerId,
      scope,
      parentGoalId: null,
      title,
      description: null,
      metricType,
      testCategory,
      currentValue,
      targetValue,
      unit,
      dueDate: null,
      status,
      createdAt: now,
      updatedAt: now,
    });
  }
}

function enableAzureConfig(
  overrides: { buildDefinitionId?: number } = {},
  categoryMapTitles: { unit?: string; api?: string; ui?: string } = {},
) {
  const now = new Date().toISOString();
  inMemory.createMetricSourceConfig({
    id: "source-config-azure-devops",
    teamId: "team-qa",
    source: "AZURE_DEVOPS",
    settings: JSON.stringify({
      organization: "org",
      project: "project",
      ...(typeof overrides.buildDefinitionId === "number" ? { buildDefinitionId: overrides.buildDefinitionId } : {}),
      categoryMap: {
        unit: { runTitleIncludes: categoryMapTitles.unit ?? "unit" },
        api: { runTitleIncludes: categoryMapTitles.api ?? "api" },
        ui: { runTitleIncludes: categoryMapTitles.ui ?? "ui" },
      },
    }),
    // Auth comes exclusively from the team's stored PAT (no env-var fallback).
    encryptedPat: encryptPat("secret-token"),
    enabled: 1,
    createdAt: now,
    updatedAt: now,
  });
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
