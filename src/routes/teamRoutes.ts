import { Router } from "express";
import { db } from "../db/sqlite.js";
import { createSqliteRepository, toBoolean } from "../db/repository.js";
import { requireAuth, requireTeamMembership } from "../middleware/auth.js";
import { refreshAzureMetrics } from "../services/azureMetricsService.js";
import { getTeamDashboard, getTeamGoals, getTeamMetrics } from "../services/dashboardService.js";
import { formatGoal, validateAndBuildGoal } from "../services/goalService.js";

export const teamRoutes = Router();
const repository = createSqliteRepository(db);
const protectedTeam = requireTeamMembership(repository);

teamRoutes.post("/join", requireAuth(repository), (req, res) => {
  const joinCode = typeof req.body?.joinCode === "string" ? req.body.joinCode.trim() : "";

  if (!joinCode) {
    res.status(400).json({ error: "Validation failed", fields: { joinCode: "Join code is required" } });
    return;
  }

  const team = repository.findTeamByJoinCode(joinCode);
  if (!team) {
    res.status(404).json({ error: "Join code not found" });
    return;
  }

  repository.createMembership(req.currentUser!.id, team.id);
  res.json({ team: { id: team.id, name: team.name } });
});

teamRoutes.get("/:teamId/dashboard", (req, res) => {
  const dashboard = getTeamDashboard(repository, req.params.teamId);

  if (!dashboard) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(dashboard);
});

teamRoutes.get("/:teamId/metrics", async (req, res) => {
  res.json({ metrics: getTeamMetrics(repository, req.params.teamId) });
});

teamRoutes.get("/:teamId/goals", async (req, res) => {
  res.json({ goals: getTeamGoals(repository, req.params.teamId) });
});

teamRoutes.post("/:teamId/goals", protectedTeam, (req, res) => {
  const teamId = String(req.params.teamId);
  const result = validateAndBuildGoal(repository, teamId, req.body);

  if (!result.ok) {
    res.status(result.status).json(result.body);
    return;
  }

  repository.createGoal(result.goal);
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

teamRoutes.get("/:teamId/test-suites", async (req, res) => {
  const testSuites = repository.findTestSuitesByTeam(req.params.teamId);

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
