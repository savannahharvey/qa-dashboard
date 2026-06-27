import { randomUUID } from "node:crypto";
import { Router } from "express";
import { repository } from "../db/index.js";
import { toBoolean } from "../db/repository.js";
import { requireAuth, requireTeamMembership } from "../middleware/auth.js";
import { listAzurePipelines, refreshAzureMetrics } from "../services/azureMetricsService.js";
import { getTeamDashboard, getTeamGoals, getTeamMetrics } from "../services/dashboardService.js";
import { formatGoal, validateAndBuildGoal } from "../services/goalService.js";

export const teamRoutes = Router();
const protectedTeam = requireTeamMembership(repository);

teamRoutes.post("/create", requireAuth(repository), async (req, res) => {
  const teamName = typeof req.body?.teamName === "string" ? req.body.teamName.trim() : "";

  if (!teamName) {
    res.status(400).json({ error: "Validation failed", fields: { teamName: "Team name is required" } });
    return;
  }

  const team = {
    id: `team-${randomUUID()}`,
    name: teamName,
    joinCode: generateJoinCode(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await repository.createTeam(team);
  await repository.createMembership(req.currentUser!.id, team.id);

  res.json({
    team: { id: team.id, name: team.name, joinCode: team.joinCode },
    teams: await repository.findTeamsByUser(req.currentUser!.id),
  });
});

teamRoutes.post("/join", requireAuth(repository), async (req, res) => {
  const joinCode = typeof req.body?.joinCode === "string" ? req.body.joinCode.trim() : "";

  if (!joinCode) {
    res.status(400).json({ error: "Validation failed", fields: { joinCode: "Join code is required" } });
    return;
  }

  const team = await repository.findTeamByJoinCode(joinCode);
  if (!team) {
    res.status(404).json({ error: "Join code not found" });
    return;
  }

  await repository.createMembership(req.currentUser!.id, team.id);
  res.json({
    team: { id: team.id, name: team.name },
    teams: await repository.findTeamsByUser(req.currentUser!.id),
  });
});

teamRoutes.get("/:teamId/dashboard", async (req, res) => {
  const dashboard = await getTeamDashboard(repository, req.params.teamId);

  if (!dashboard) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(dashboard);
});

teamRoutes.get("/:teamId/metrics", async (req, res) => {
  res.json({ metrics: await getTeamMetrics(repository, req.params.teamId) });
});

teamRoutes.get("/:teamId/goals", async (req, res) => {
  res.json({ goals: await getTeamGoals(repository, req.params.teamId) });
});

teamRoutes.post("/:teamId/goals", protectedTeam, async (req, res) => {
  const teamId = String(req.params.teamId);
  const result = await validateAndBuildGoal(repository, teamId, req.body);

  if (!result.ok) {
    res.status(result.status).json(result.body);
    return;
  }

  await repository.createGoal(result.goal);
  res.status(201).json({ goal: formatGoal(result.goal) });
});

teamRoutes.post("/:teamId/metrics/refresh", protectedTeam, async (req, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const source = typeof req.body?.source === "string" ? req.body.source : "";

    if (source !== "azure-devops") {
      res.status(400).json({ error: "Validation failed", fields: { source: "Source must be azure-devops" } });
      return;
    }

    res.json(await refreshAzureMetrics(repository, teamId));
  } catch (error) {
    next(error);
  }
});

teamRoutes.get("/:teamId/metrics/config", protectedTeam, async (req, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const config = await repository.findMetricSourceConfig(teamId, "AZURE_DEVOPS");

    if (!config) {
      res.json({ config: null });
      return;
    }

    res.json({
      config: {
        source: config.source,
        enabled: toBoolean(config.enabled),
        settings: parseMetricSourceSettings(config.settings),
      },
    });
  } catch (error) {
    next(error);
  }
});

teamRoutes.get("/:teamId/metrics/azure/pipelines", protectedTeam, async (req, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    res.json(await listAzurePipelines(repository, teamId));
  } catch (error) {
    next(error);
  }
});

teamRoutes.post("/:teamId/metrics/config", protectedTeam, async (req, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const source = typeof req.body?.source === "string" ? req.body.source : "";
    const enabled = typeof req.body?.enabled === "boolean" ? req.body.enabled : false;
    const settings = req.body?.settings ?? {};

    if (source !== "AZURE_DEVOPS" && source !== "azure-devops") {
      res.status(400).json({ error: "Validation failed", fields: { source: "Only azure-devops is supported" } });
      return;
    }

    // Do not accept secrets in API payloads. Ensure settings do not include PAT or token values.
    const forbiddenKeys = ["pat", "token", "AZURE_DEVOPS_PAT", "personalAccessToken"];
    for (const k of Object.keys(settings)) {
      if (forbiddenKeys.includes(k)) {
        res.status(400).json({ error: "Validation failed", fields: { settings: "Secrets must not be sent in request body" } });
        return;
      }
    }

    // Store the provided settings JSON as a string. Server-side AZURE_DEVOPS_PAT must be set separately.
    await repository.upsertMetricSourceConfig(teamId, "AZURE_DEVOPS", JSON.stringify(settings), enabled ? 1 : 0);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

teamRoutes.get("/:teamId/test-suites", async (req, res) => {
  const azureConfig = await repository.findMetricSourceConfig(req.params.teamId, "AZURE_DEVOPS");
  if (azureConfig && (azureConfig.enabled === 1 || azureConfig.enabled === true)) {
    res.json({ testSuites: [] });
    return;
  }

  const testSuites = await repository.findTestSuitesByTeam(req.params.teamId);

  res.json({
    testSuites: testSuites.map((suite) => ({
      id: suite.id,
      teamId: suite.teamId,
      category: suite.category.toLowerCase(),
      name: suite.name,
      enabled: toBoolean(suite.enabled),
      source: suite.source.toLowerCase().replace("_", "-"),
    })),
  });
});

function parseMetricSourceSettings(settings: string) {
  try {
    return JSON.parse(settings) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function generateJoinCode() {
  return `QA-${randomUUID().slice(0, 6).toUpperCase()}`;
}
