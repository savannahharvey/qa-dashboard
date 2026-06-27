// @vitest-environment jsdom

import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import { TestResultsPage } from "./TestResultsPage";
import { getTeamMetrics } from "../api";
import { useAuth } from "../state/AuthContext";
import type { QaMetric, Team } from "../types";

vi.mock("../state/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api", () => ({
  getTeamMetrics: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const getTeamMetricsMock = vi.mocked(getTeamMetrics);

const metricsFixture: QaMetric[] = [
  {
    id: "metric-api-passing",
    teamId: "team-qa",
    testSuiteId: "suite-api",
    category: "api",
    kind: "tests-passing",
    status: "passing",
    value: 42,
    unit: "tests",
    source: "azure-devops",
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TestResultsPage", () => {
  it("renders the print button and invokes window.print", async () => {
    useAuthMock.mockReturnValue(authWithTeam());
    getTeamMetricsMock.mockResolvedValue({ metrics: metricsFixture });
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(
      <MemoryRouter>
        <TestResultsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading Azure metrics...")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Print \/ save PDF/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Print \/ save PDF/i }));

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalledTimes(1);
    });
  });
});

function authWithTeam() {
  return {
    status: "authenticated" as const,
    user: { id: "user-sam", username: "sam", displayName: "Sam" },
    teams: [{ id: "team-qa", name: "QA Dashboard Team" } satisfies Team],
    primaryTeam: { id: "team-qa", name: "QA Dashboard Team" } satisfies Team,
    reloadSession: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
}
