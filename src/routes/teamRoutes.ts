import { Router } from "express";
import { db } from "../db/sqlite.js";
import { createSqliteRepository, toBoolean } from "../db/repository.js";
import { getTeamDashboard, getTeamGoals, getTeamMetrics } from "../services/dashboardService.js";

export const teamRoutes = Router();
const repository = createSqliteRepository(db);

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
