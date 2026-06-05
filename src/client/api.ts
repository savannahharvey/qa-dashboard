import type { Dashboard, Goal, GoalInput, Team, User } from "./types";

type ApiErrorBody = {
  error?: string;
  fields?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error ?? "Request failed");
    this.status = status;
    this.fields = body.fields ?? {};
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}

export function getCurrentSession() {
  return requestJson<{ user: User; teams: Team[] }>("/api/auth/me");
}

export function signIn(username: string, password: string) {
  return requestJson<{ user: User; teams: Team[] }>("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function signUp(username: string, password: string, displayName: string) {
  return requestJson<{ user: User }>("/api/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({ username, password, displayName }),
  });
}

export function signOut() {
  return requestJson<void>("/api/auth/sign-out", { method: "POST" });
}

export function joinTeam(joinCode: string) {
  return requestJson<{ team: Team }>("/api/teams/join", {
    method: "POST",
    body: JSON.stringify({ joinCode }),
  });
}

export function getDashboard(teamId: string) {
  return requestJson<Dashboard>(`/api/teams/${teamId}/dashboard`);
}

export function createGoal(teamId: string, goal: GoalInput) {
  return requestJson<{ goal: Goal }>(`/api/teams/${teamId}/goals`, {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

export function refreshMetrics(teamId: string) {
  return requestJson(`/api/teams/${teamId}/metrics/refresh`, {
    method: "POST",
    body: JSON.stringify({ source: "azure-devops" }),
  });
}
