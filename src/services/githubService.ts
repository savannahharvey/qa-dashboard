export type GithubConnectivity = {
  status: "connected" | "error" | "idle";
  message?: string;
};

export type GithubRepoRef = { owner: string; repo: string };

/** One week of the CI/CD velocity window: how many commits landed vs. how many CI runs fired. */
export type VelocityWeek = { weekStart: string; commits: number; runs: number };

export type GithubVelocity = {
  weeks: VelocityWeek[];
  totalCommits: number;
  totalRuns: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const VELOCITY_WEEKS = 12;
const MAX_PAGES = 5; // Bound API usage: up to 500 commits / 500 runs across the window.
const CACHE_TTL_MS = 60 * 60 * 1000; // Re-fetching 12 weeks on every page load is wasteful; cache for an hour.

const velocityCache = new Map<string, { expires: number; data: GithubVelocity }>();

function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "qa-dashboard",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Accepts the shapes users typically paste — a full URL, a bare `github.com/...`
 * path, or just `owner/repo` — and extracts the `{ owner, repo }` pair.
 * Returns null when the input doesn't contain a recognisable repository path.
 */
export function parseGithubRepo(repoUrl: string): GithubRepoRef | null {
  const trimmed = repoUrl.trim();
  if (!trimmed) {
    return null;
  }

  // Strip protocol, an optional git@ SSH prefix, and any github.com host prefix.
  const withoutProtocol = trimmed
    .replace(/^git@github\.com:/i, "")
    .replace(/^https?:\/\//i, "")
    .replace(/^github\.com\//i, "");

  const segments = withoutProtocol.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, "");
  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}

/**
 * Performs a live check against the GitHub REST API to confirm the stored repo
 * URL (and optional PAT) can actually reach the repository. The token is never
 * returned or logged — only a coarse connected/error status flows back out.
 */
export async function checkGithubConnectivity(repoUrl: string, token?: string): Promise<GithubConnectivity> {
  const ref = parseGithubRepo(repoUrl);
  if (!ref) {
    return { status: "error", message: "Enter a repository as owner/repo or a github.com URL." };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`,
      { headers: githubHeaders(token) },
    );
  } catch {
    return { status: "error", message: "Could not reach GitHub. Check your connection and try again." };
  }

  if (response.ok) {
    return { status: "connected" };
  }

  if (response.status === 401) {
    return { status: "error", message: "GitHub rejected the personal access token. Check that it's valid." };
  }

  if (response.status === 403) {
    return { status: "error", message: "GitHub denied access. The token may lack repo scope or be rate limited." };
  }

  if (response.status === 404) {
    return {
      status: "error",
      message: token
        ? "Repository not found, or the token can't access it."
        : "Repository not found. If it's private, add a personal access token.",
    };
  }

  return { status: "error", message: `GitHub responded with an unexpected status (${response.status}).` };
}

/** Start-of-window aligned to whole weeks: the Monday-agnostic 7-day bucket boundary VELOCITY_WEEKS ago. */
function windowStart(now: number): number {
  return now - VELOCITY_WEEKS * WEEK_MS;
}

function emptyWeeks(start: number): VelocityWeek[] {
  return Array.from({ length: VELOCITY_WEEKS }, (_, index) => ({
    weekStart: new Date(start + index * WEEK_MS).toISOString(),
    commits: 0,
    runs: 0,
  }));
}

function bucketIndex(timestamp: number, start: number): number {
  if (Number.isNaN(timestamp) || timestamp < start) {
    return -1;
  }
  const index = Math.floor((timestamp - start) / WEEK_MS);
  return index >= 0 && index < VELOCITY_WEEKS ? index : -1;
}

async function githubGetJson<T>(url: string, token: string | undefined): Promise<T> {
  const response = await fetch(url, { headers: githubHeaders(token) });
  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

type CommitItem = { commit?: { committer?: { date?: string }; author?: { date?: string } } };
type WorkflowRunItem = { run_started_at?: string; created_at?: string };

async function fetchCommitDates(ref: GithubRepoRef, token: string | undefined, sinceIso: string): Promise<number[]> {
  const dates: number[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url =
      `https://api.github.com/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/commits` +
      `?since=${encodeURIComponent(sinceIso)}&per_page=100&page=${page}`;
    const items = await githubGetJson<CommitItem[]>(url, token);
    for (const item of items) {
      const raw = item.commit?.committer?.date ?? item.commit?.author?.date;
      if (raw) {
        dates.push(new Date(raw).getTime());
      }
    }
    if (items.length < 100) {
      break;
    }
  }
  return dates;
}

async function fetchWorkflowRunDates(ref: GithubRepoRef, token: string | undefined, sinceIso: string): Promise<number[]> {
  const createdFilter = `>=${sinceIso.slice(0, 10)}`;
  const dates: number[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url =
      `https://api.github.com/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/actions/runs` +
      `?created=${encodeURIComponent(createdFilter)}&per_page=100&page=${page}`;
    const body = await githubGetJson<{ workflow_runs?: WorkflowRunItem[] }>(url, token);
    const runs = Array.isArray(body.workflow_runs) ? body.workflow_runs : [];
    for (const run of runs) {
      const raw = run.run_started_at ?? run.created_at;
      if (raw) {
        dates.push(new Date(raw).getTime());
      }
    }
    if (runs.length < 100) {
      break;
    }
  }
  return dates;
}

/**
 * Fetches commit and GitHub Actions run history for the last {@link VELOCITY_WEEKS} weeks and
 * buckets both by week. Results are cached per repo for an hour. Throws if GitHub can't be reached
 * so the caller can surface an error panel without affecting other analytics.
 */
export async function fetchGithubVelocity(repoUrl: string, token?: string): Promise<GithubVelocity> {
  const ref = parseGithubRepo(repoUrl);
  if (!ref) {
    throw new Error("Repository URL could not be parsed.");
  }

  const cacheKey = `${ref.owner}/${ref.repo}`;
  const cached = velocityCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const now = Date.now();
  const start = windowStart(now);
  const sinceIso = new Date(start).toISOString();

  const [commitDates, runDates] = await Promise.all([
    fetchCommitDates(ref, token, sinceIso),
    fetchWorkflowRunDates(ref, token, sinceIso),
  ]);

  const weeks = emptyWeeks(start);
  let totalCommits = 0;
  let totalRuns = 0;

  for (const date of commitDates) {
    const index = bucketIndex(date, start);
    if (index >= 0) {
      weeks[index].commits += 1;
      totalCommits += 1;
    }
  }
  for (const date of runDates) {
    const index = bucketIndex(date, start);
    if (index >= 0) {
      weeks[index].runs += 1;
      totalRuns += 1;
    }
  }

  const data: GithubVelocity = { weeks, totalCommits, totalRuns };
  velocityCache.set(cacheKey, { expires: now + CACHE_TTL_MS, data });
  return data;
}

/** Exposed for tests so a stale cache can't leak between cases. */
export function clearVelocityCache(): void {
  velocityCache.clear();
}
