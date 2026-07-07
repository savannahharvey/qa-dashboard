// @vitest-environment jsdom

import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InsightsPage } from "./InsightsPage";
import { sampleQualityMatrix, qualityColumns } from "../domain/sampleInsights";

vi.mock("../state/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-sam", username: "sam", displayName: "Sam" },
    primaryTeam: { id: "team-qa", name: "QA Dashboard Team" },
    signOut: vi.fn(),
  })),
}));

describe("InsightsPage", () => {
  it("renders all four insight sections", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/insights"]}>
        <InsightsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Automation vs. your codebase" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Unit / Integration / E2E balance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Flow coverage" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Principles by feature" })).toBeInTheDocument();

    for (const row of sampleQualityMatrix.rows) {
      expect(screen.getByText(row.feature)).toBeInTheDocument();
    }
    for (const col of qualityColumns) {
      expect(screen.getByText(col)).toBeInTheDocument();
    }
  });
});
