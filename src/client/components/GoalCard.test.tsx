// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoalCard } from "./GoalCard";
import type { Goal } from "../types";

describe("GoalCard", () => {
  it("renders owner, status, metric, and capped progress", () => {
    render(<GoalCard goal={goal()} />);

    expect(screen.getByRole("heading", { name: "Keep API tests passing" })).toBeInTheDocument();
    expect(screen.getByText("Fixture Jordan")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Tests passing")).toBeInTheDocument();
    expect(screen.getByLabelText("Keep API tests passing progress 100%")).toBeInTheDocument();
  });
});

function goal(): Goal {
  return {
    id: "goal-api",
    teamId: "team-qa",
    ownerId: "user-jordan",
    ownerName: "Fixture Jordan",
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
