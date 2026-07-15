import { randomUUID } from "node:crypto";
import { Router } from "express";
import { repository } from "../db/index.js";
import { toBoolean } from "../db/repository.js";
import { requireAuth, requireTeamMembership } from "../middleware/auth.js";
import { listAzurePipelines, refreshAzureMetrics } from "../services/azureMetricsService.js";
import { getTeamAnalytics } from "../services/analyticsService.js";
import { getTeamDashboard, getTeamGoals, getTeamMetrics } from "../services/dashboardService.js";
import { formatGoal, validateAndBuildGoal } from "../services/goalService.js";
import { encryptPat, decryptPat } from "../services/patEncryption.js";
import { checkGithubConnectivity, parseGithubRepo, type GithubConnectivity } from "../services/githubService.js";

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

teamRoutes.put("/:teamId/goals/:goalId", protectedTeam, async (req, res) => {
  const teamId = String(req.params.teamId);
  const goalId = String(req.params.goalId);

  const existing = await repository.findGoal(goalId);
  if (!existing || existing.teamId !== teamId) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const result = await validateAndBuildGoal(repository, teamId, req.body);
  if (!result.ok) {
    res.status(result.status).json(result.body);
    return;
  }

  const updated = await repository.updateGoal(goalId, teamId, result.goal);
  if (!updated) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  res.json({ goal: formatGoal(updated) });
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

teamRoutes.get("/:teamId/analytics", protectedTeam, async (req, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    res.json(await getTeamAnalytics(repository, teamId));
  } catch (error) {
    next(error);
  }
});

teamRoutes.get("/:teamId/metrics/history", protectedTeam, async (req, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const limitParam = Number(req.query.limit);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.trunc(limitParam), 1), 90) : 30;
    const snapshots = await repository.findMetricSnapshots(teamId, limit);

    res.json({
      history: snapshots.map((snapshot) => ({
        date: snapshot.capturedOn,
        passedTests: snapshot.passedTests,
        totalTests: snapshot.totalTests,
        passRate: snapshot.totalTests > 0 ? Math.round((snapshot.passedTests / snapshot.totalTests) * 100) : null,
      })),
    });
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
        hasPat: Boolean(config.encryptedPat),
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
    const pat = typeof req.body?.pat === "string" ? req.body.pat.trim() : undefined;

    if (source !== "AZURE_DEVOPS" && source !== "azure-devops") {
      res.status(400).json({ error: "Validation failed", fields: { source: "Only azure-devops is supported" } });
      return;
    }

    // The PAT travels in its own top-level field (see `pat` above), never inside `settings`.
    const forbiddenKeys = ["pat", "token", "AZURE_DEVOPS_PAT", "personalAccessToken"];
    for (const k of Object.keys(settings)) {
      if (forbiddenKeys.includes(k)) {
        res.status(400).json({ error: "Validation failed", fields: { settings: "Secrets must not be sent inside settings" } });
        return;
      }
    }

    await repository.upsertMetricSourceConfig(teamId, "AZURE_DEVOPS", JSON.stringify(settings), enabled ? 1 : 0);

    if (pat !== undefined) {
      await repository.updateMetricSourcePat(teamId, "AZURE_DEVOPS", pat === "" ? null : encryptPat(pat));
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

teamRoutes.get("/:teamId/integrations/github", protectedTeam, async (req, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const config = await repository.findMetricSourceConfig(teamId, "GITHUB");

    if (!config) {
      res.json({ config: null, status: { status: "idle" } });
      return;
    }

    const settings = parseGithubSettings(config.settings);
    const enabled = toBoolean(config.enabled);
    let status: GithubConnectivity = { status: "idle" };
    if (enabled && settings.repoUrl) {
      const token = config.encryptedPat ? safeDecryptPat(config.encryptedPat) : undefined;
      status = await checkGithubConnectivity(settings.repoUrl, token);
    }

    res.json({
      config: {
        source: config.source,
        enabled,
        settings: { repoUrl: settings.repoUrl ?? "", branch: settings.branch ?? "main" },
        hasPat: Boolean(config.encryptedPat),
      },
      status,
    });
  } catch (error) {
    next(error);
  }
});

teamRoutes.post("/:teamId/integrations/github", protectedTeam, async (req, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const enabled = typeof req.body?.enabled === "boolean" ? req.body.enabled : false;
    const repoUrl = typeof req.body?.repoUrl === "string" ? req.body.repoUrl.trim() : "";
    const branch =
      typeof req.body?.branch === "string" && req.body.branch.trim() ? req.body.branch.trim() : "main";
    // The PAT travels in its own top-level field, never inside settings.
    const pat = typeof req.body?.pat === "string" ? req.body.pat.trim() : undefined;

    if (enabled && !repoUrl) {
      res.status(400).json({ error: "Validation failed", fields: { repoUrl: "Repository URL is required to connect GitHub." } });
      return;
    }

    if (enabled && !parseGithubRepo(repoUrl)) {
      res.status(400).json({
        error: "Validation failed",
        fields: { repoUrl: "Enter a repository as owner/repo or a github.com URL." },
      });
      return;
    }

    await repository.upsertMetricSourceConfig(teamId, "GITHUB", JSON.stringify({ repoUrl, branch }), enabled ? 1 : 0);

    if (pat !== undefined) {
      await repository.updateMetricSourcePat(teamId, "GITHUB", pat === "" ? null : encryptPat(pat));
    }

    // Re-read so the connectivity check uses the effective PAT — a freshly saved one, or the previously stored one.
    const saved = await repository.findMetricSourceConfig(teamId, "GITHUB");
    let status: GithubConnectivity = { status: "idle" };
    if (enabled && repoUrl) {
      const token = saved?.encryptedPat ? safeDecryptPat(saved.encryptedPat) : undefined;
      status = await checkGithubConnectivity(repoUrl, token);
    }

    res.json({ ok: true, hasPat: Boolean(saved?.encryptedPat), status });
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

function parseGithubSettings(settings: string): { repoUrl?: string; branch?: string } {
  try {
    const parsed = JSON.parse(settings) as { repoUrl?: unknown; branch?: unknown };
    return {
      repoUrl: typeof parsed.repoUrl === "string" ? parsed.repoUrl : undefined,
      branch: typeof parsed.branch === "string" ? parsed.branch : undefined,
    };
  } catch {
    return {};
  }
}

function safeDecryptPat(encryptedPat: string): string | undefined {
  try {
    return decryptPat(encryptedPat);
  } catch {
    // Treat an undecryptable stored PAT (e.g. an ENCRYPTION_KEY change) as if none were set.
    return undefined;
  }
}

function generateJoinCode() {
  return `QA-${randomUUID().slice(0, 6).toUpperCase()}`;
}
