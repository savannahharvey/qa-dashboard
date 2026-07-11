// @vitest-environment jsdom

import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InsightsPage } from "./InsightsPage";

vi.mock("../state/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-sam", username: "sam", displayName: "Sam" },
    primaryTeam: { id: "team-qa", name: "QA Dashboard Team" },
    signOut: vi.fn(),
  })),
}));

describe("InsightsPage", () => {
  it("renders an empty state with no fabricated data", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/insights"]}>
        <InsightsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No insights yet" })).toBeInTheDocument();
  });
});
