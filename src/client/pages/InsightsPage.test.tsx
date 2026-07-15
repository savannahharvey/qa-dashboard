// @vitest-environment jsdom

import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InsightsPage } from "./InsightsPage";
import { getTeamAnalytics, type TeamAnalytics } from "../api";

vi.mock("../state/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-sam", username: "sam", displayName: "Sam" },
    primaryTeam: { id: "team-qa", name: "QA Dashboard Team" },
    signOut: vi.fn(),
  })),
}));

vi.mock("../api", () => ({
  getTeamAnalytics: vi.fn(),
}));

const getTeamAnalyticsMock = vi.mocked(getTeamAnalytics);

// A team with nothing connected: every panel is unavailable and there is no health score.
const emptyAnalytics: TeamAnalytics = {
  generatedAt: "2026-07-15T00:00:00.000Z",
  healthScore: null,
  testTypeBalance: { available: false, reason: "Connect Azure DevOps to see test type balance." },
  qualityPrinciples: { available: false, reason: "Connect Azure DevOps to scan quality principles." },
  ciCdVelocity: { available: false, reason: "Connect GitHub to see CI/CD velocity." },
  userFlowCoverage: { available: false, reason: "User flow coverage isn't available yet." },
};

describe("InsightsPage", () => {
  it("renders unavailable panels with no fabricated data when nothing is connected", async () => {
    getTeamAnalyticsMock.mockResolvedValue(emptyAnalytics);

    render(
      <MemoryRouter initialEntries={["/dashboard/insights"]}>
        <InsightsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Insights" })).toBeInTheDocument();

    // No fabricated score — the health hero explicitly reports missing data.
    expect(await screen.findByText("Not enough data yet")).toBeInTheDocument();

    // Each panel surfaces what's required instead of inventing numbers.
    expect(screen.getByText("Connect Azure DevOps to see test type balance.")).toBeInTheDocument();
    expect(screen.getByText("Connect GitHub to see CI/CD velocity.")).toBeInTheDocument();
    expect(screen.getByText("User flow coverage isn't available yet.")).toBeInTheDocument();
  });
});
