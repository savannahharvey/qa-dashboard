import { afterEach, describe, expect, it, vi } from "vitest";
import { checkGithubConnectivity, clearVelocityCache, fetchGithubVelocity, parseGithubRepo } from "./githubService.js";

describe("parseGithubRepo", () => {
  it.each([
    ["https://github.com/acme/qa-dashboard", { owner: "acme", repo: "qa-dashboard" }],
    ["github.com/acme/qa-dashboard", { owner: "acme", repo: "qa-dashboard" }],
    ["acme/qa-dashboard", { owner: "acme", repo: "qa-dashboard" }],
    ["https://github.com/acme/qa-dashboard.git", { owner: "acme", repo: "qa-dashboard" }],
    ["git@github.com:acme/qa-dashboard.git", { owner: "acme", repo: "qa-dashboard" }],
    ["https://github.com/acme/qa-dashboard/tree/main", { owner: "acme", repo: "qa-dashboard" }],
  ])("parses %s", (input, expected) => {
    expect(parseGithubRepo(input)).toEqual(expected);
  });

  it.each(["", "   ", "acme", "https://github.com/acme"])("rejects %s", (input) => {
    expect(parseGithubRepo(input)).toBeNull();
  });
});

describe("checkGithubConnectivity", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an error without calling GitHub when the repo URL is unparseable", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await checkGithubConnectivity("not-a-repo");
    expect(result.status).toBe("error");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports connected on a 200 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await checkGithubConnectivity("acme/qa-dashboard")).toEqual({ status: "connected" });
  });

  it("sends a bearer token when a PAT is provided", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    await checkGithubConnectivity("acme/qa-dashboard", "secret-token");
    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
  });

  it("reports an error for a 401 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
    const result = await checkGithubConnectivity("acme/qa-dashboard", "bad-token");
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/token/i);
  });

  it("reports an error for a 404 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 404 }));
    const result = await checkGithubConnectivity("acme/missing");
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/not found/i);
  });
});

describe("fetchGithubVelocity", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearVelocityCache();
  });

  const daysAgoIso = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  it("buckets commits and CI runs by week and totals them", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/commits")) {
        return new Response(
          JSON.stringify([
            { commit: { committer: { date: daysAgoIso(1) } } },
            { commit: { committer: { date: daysAgoIso(3) } } },
            { commit: { author: { date: daysAgoIso(10) } } },
          ]),
          { status: 200 },
        );
      }
      if (url.includes("/actions/runs")) {
        return new Response(
          JSON.stringify({ workflow_runs: [{ run_started_at: daysAgoIso(1) }, { created_at: daysAgoIso(10) }] }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    });

    const data = await fetchGithubVelocity("acme/repo", "token");

    expect(data.weeks).toHaveLength(12);
    expect(data.totalCommits).toBe(3);
    expect(data.totalRuns).toBe(2);
    // Commits 1 and 3 days ago land in the most recent week; the 10-day-old one lands a week earlier.
    expect(data.weeks[11].commits).toBe(2);
    expect(data.weeks[11].runs).toBe(1);
    expect(data.weeks[10].commits).toBe(1);
  });

  it("serves the second call for the same repo from cache", async () => {
    // A fresh Response per call — a single Response body can only be read once.
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }));

    await fetchGithubVelocity("acme/cached", "token");
    const callsAfterFirst = fetchSpy.mock.calls.length;
    await fetchGithubVelocity("acme/cached", "token");

    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst);
  });

  it("throws when GitHub returns a non-ok status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));
    await expect(fetchGithubVelocity("acme/broken", "token")).rejects.toThrow();
  });
});
