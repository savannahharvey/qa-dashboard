// @vitest-environment jsdom

import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createTeam, getDashboard, getTestsOverTime, joinTeam, refreshMetrics } from "../api";
import { DashboardPage } from "./DashboardPage";
import type { Dashboard, Goal, Team } from "../types";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("../state/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return {
    ...actual,
    createTeam: vi.fn(),
    getDashboard: vi.fn(),
    getTestsOverTime: vi.fn(),
    joinTeam: vi.fn(),
    refreshMetrics: vi.fn(),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

import { useAuth } from "../state/AuthContext";

const useAuthMock = vi.mocked(useAuth);

vi.mocked(getTestsOverTime).mockResolvedValue({ data: [], meta: {} });

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardPage", () => {

  it("renders the live dashboard data and a loading state", async () => {
    useAuthMock.mockReturnValue(authWithTeam());
    vi.mocked(getDashboard).mockResolvedValueOnce(dashboardFixture());

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "QA Dashboard Team" })).toBeInTheDocument();
    expect(screen.getByText("Keep API tests passing")).toBeInTheDocument();
    expect(screen.getByText("74%")).toBeInTheDocument();
    expect(screen.getByText("1 total")).toBeInTheDocument();
  });

  it("shows an empty state when the dashboard has no goals", async () => {
    useAuthMock.mockReturnValue(authWithTeam());
    vi.mocked(getDashboard).mockResolvedValueOnce(emptyDashboardFixture());

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("No goals yet")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable")).toHaveLength(3);
  });

  it("re-fetches the dashboard after a successful metric refresh", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authWithTeam());
    vi.mocked(getDashboard).mockResolvedValueOnce(dashboardFixture()).mockResolvedValueOnce(updatedDashboardFixture());
    vi.mocked(refreshMetrics).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("74%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(refreshMetrics).toHaveBeenCalledWith("team-qa");
    expect(await screen.findByText("91%")).toBeInTheDocument();
    expect(vi.mocked(getDashboard).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it.each([
    [401, "Your session expired. Please sign in again."],
    [403, "You do not have access to this team's dashboard."],
    [404, "That team could not be found."],
  ])("shows a clear recovery state for %s responses", async (status, message) => {
    const reloadSession = vi.fn();
    useAuthMock.mockReturnValue(authWithTeam({ reloadSession }));
    vi.mocked(getDashboard).mockRejectedValueOnce(new ApiError(status, { error: "Request failed" }));

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(message)).toBeInTheDocument();
    if (status === 401) {
      expect(reloadSession).toHaveBeenCalledTimes(1);
    }
  });

  it("creates a team and reloads the authenticated session", async () => {
    const user = userEvent.setup();
    const reloadSession = vi.fn();
    useAuthMock.mockReturnValue(authWithoutTeam({ reloadSession }));
    vi.mocked(createTeam).mockResolvedValueOnce({ team: { id: "team-qa", name: "QA Dashboard Team" } });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Team name"), "QA Dashboard Team");
    await user.click(screen.getByRole("button", { name: "Create team" }));

    expect(createTeam).toHaveBeenCalledWith("QA Dashboard Team");
    expect(reloadSession).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("joins a team and reloads the authenticated session", async () => {
    const user = userEvent.setup();
    const reloadSession = vi.fn();
    useAuthMock.mockReturnValue(authWithoutTeam({ reloadSession }));
    vi.mocked(joinTeam).mockResolvedValueOnce({ team: { id: "team-qa", name: "QA Dashboard Team" } });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Join code"), "QA-232");
    await user.click(screen.getByRole("button", { name: "Join team" }));

    expect(joinTeam).toHaveBeenCalledWith("QA-232");
    expect(reloadSession).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("shows the setup flow when opened directly on the setup route", async () => {
    useAuthMock.mockReturnValue(authWithoutTeam());

    render(
      <MemoryRouter initialEntries={["/dashboard/setup"]}>
        <DashboardPage mode="setup" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Create or join a team" })).toBeInTheDocument();
  });
});

function authWithTeam(overrides: Partial<{ reloadSession: () => Promise<void> }> = {}) {
  return {
    status: "authenticated" as const,
    user: { id: "user-sam", username: "sam", displayName: "Sam" },
    teams: [{ id: "team-qa", name: "QA Dashboard Team" } satisfies Team],
    primaryTeam: { id: "team-qa", name: "QA Dashboard Team" } satisfies Team,
    reloadSession: overrides.reloadSession ?? vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
}

function authWithoutTeam(overrides: Partial<{ reloadSession: () => Promise<void> }> = {}) {
  return {
    status: "authenticated" as const,
    user: { id: "user-sam", username: "sam", displayName: "Sam" },
    teams: [],
    primaryTeam: null,
    reloadSession: overrides.reloadSession ?? vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
}

function dashboardFixture(): Dashboard {
  return {
    team: {
      id: "team-qa",
      name: "QA Dashboard Team",
      joinCode: "QA-232",
    },
    testSuites: [
      { id: "suite-api", category: "api", name: "API tests", enabled: true, source: "sample" },
      { id: "suite-unit", category: "unit", name: "Unit tests", enabled: true, source: "sample" },
      { id: "suite-ui", category: "ui", name: "UI tests", enabled: true, source: "sample" },
    ],
    metrics: [
      {
        id: "metric-api-coverage",
        teamId: "team-qa",
        testSuiteId: "suite-api",
        category: "api",
        kind: "test-coverage",
        value: 74,
        unit: "%",
        source: "sample",
      },
    ],
    goals: [goalFixture()],
  };
}

function updatedDashboardFixture(): Dashboard {
  return {
    ...dashboardFixture(),
    metrics: [
      {
        id: "metric-api-coverage",
        teamId: "team-qa",
        testSuiteId: "suite-api",
        category: "api",
        kind: "test-coverage",
        value: 91,
        unit: "%",
        source: "sample",
      },
    ],
  };
}

function emptyDashboardFixture(): Dashboard {
  return {
    ...dashboardFixture(),
    metrics: [],
    goals: [],
  };
}

function goalFixture(): Goal {
  return {
    id: "goal-api",
    teamId: "team-qa",
    ownerId: "user-sam",
    ownerName: "Sam",
    scope: "team",
    title: "Keep API tests passing",
    description: "Maintain passing API coverage.",
    metricType: "tests-passing",
    testCategory: "api",
    currentValue: 1,
    targetValue: 1,
    unit: null,
    status: "completed",
    progress: {
      available: true,
      currentValue: 1,
      targetValue: 1,
      percentage: 100,
      complete: true,
    },
  };
}
