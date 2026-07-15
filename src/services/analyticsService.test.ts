import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./githubService.js", () => ({ fetchGithubVelocity: vi.fn() }));

import { fetchGithubVelocity } from "./githubService.js";
import { getTeamAnalytics } from "./analyticsService.js";
import type { DashboardRepository, MetricSourceConfig } from "../db/repository.js";

function repositoryWith(githubConfig: Partial<MetricSourceConfig> | undefined): DashboardRepository {
  return {
    findMetricsByTeam: async () => [],
    findTestRunResults: async () => [],
    findMetricSourceConfig: async () => githubConfig as MetricSourceConfig | undefined,
  } as unknown as DashboardRepository;
}

function githubConfig(overrides: Partial<MetricSourceConfig> = {}): Partial<MetricSourceConfig> {
  return {
    enabled: true,
    settings: JSON.stringify({ repoUrl: "acme/repo", branch: "main" }),
    encryptedPat: null,
    ...overrides,
  };
}

describe("CI/CD velocity panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is unavailable when GitHub is not connected", async () => {
    const analytics = await getTeamAnalytics(repositoryWith(undefined), "team-1");
    expect(analytics.ciCdVelocity.available).toBe(false);
    expect(fetchGithubVelocity).not.toHaveBeenCalled();
  });

  it("is unavailable when the GitHub config is disabled", async () => {
    const analytics = await getTeamAnalytics(repositoryWith(githubConfig({ enabled: 0 })), "team-1");
    expect(analytics.ciCdVelocity.available).toBe(false);
    expect(fetchGithubVelocity).not.toHaveBeenCalled();
  });

  it("computes a score from the run/commit ratio", async () => {
    vi.mocked(fetchGithubVelocity).mockResolvedValue({
      weeks: [{ weekStart: "2026-01-01T00:00:00.000Z", commits: 10, runs: 7 }],
      totalCommits: 10,
      totalRuns: 7,
    });

    const analytics = await getTeamAnalytics(repositoryWith(githubConfig()), "team-1");

    expect(analytics.ciCdVelocity).toMatchObject({
      available: true,
      score: 70,
      totalCommits: 10,
      totalRuns: 7,
    });
    expect(analytics.healthScore).toBe(70);
  });

  it("caps the ratio at 1.0 when runs outpace commits", async () => {
    vi.mocked(fetchGithubVelocity).mockResolvedValue({ weeks: [], totalCommits: 4, totalRuns: 12 });
    const analytics = await getTeamAnalytics(repositoryWith(githubConfig()), "team-1");
    expect(analytics.ciCdVelocity).toMatchObject({ available: true, score: 100 });
  });

  it("is unavailable when there is no commit or run history", async () => {
    vi.mocked(fetchGithubVelocity).mockResolvedValue({ weeks: [], totalCommits: 0, totalRuns: 0 });
    const analytics = await getTeamAnalytics(repositoryWith(githubConfig()), "team-1");
    expect(analytics.ciCdVelocity.available).toBe(false);
  });

  it("surfaces an error reason when the GitHub fetch fails", async () => {
    vi.mocked(fetchGithubVelocity).mockRejectedValue(new Error("network down"));
    const analytics = await getTeamAnalytics(repositoryWith(githubConfig()), "team-1");
    expect(analytics.ciCdVelocity.available).toBe(false);
    if (!analytics.ciCdVelocity.available) {
      expect(analytics.ciCdVelocity.reason).toMatch(/GitHub/i);
    }
  });
});
