// @vitest-environment jsdom

import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api";
import { SignInPage } from "./SignInPage";
import { SignUpPage } from "./SignUpPage";

vi.mock("../state/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../state/AuthContext";

const useAuthMock = vi.mocked(useAuth);

describe("Auth forms", () => {
  it("shows validation feedback from sign-in errors", async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockRejectedValueOnce(
      new ApiError(400, { error: "Validation failed", fields: { username: "Username is required" } }),
    );
    useAuthMock.mockReturnValue(authState({ signIn }));

    render(
      <MemoryRouter initialEntries={["/sign-in"]}>
        <SignInPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Validation failed")).toBeInTheDocument();
    expect(screen.getByText("Username is required")).toBeInTheDocument();
  });

  it("shows validation feedback from sign-up errors", async () => {
    const user = userEvent.setup();
    const signUp = vi.fn().mockRejectedValueOnce(
      new ApiError(400, { error: "Validation failed", fields: { password: "Password must be at least 8 characters" } }),
    );
    useAuthMock.mockReturnValue(authState({ signUp }));

    render(
      <MemoryRouter initialEntries={["/sign-up"]}>
        <SignUpPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Validation failed")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
  });
});

function authState(overrides: Partial<{ signIn: ReturnType<typeof vi.fn>; signUp: ReturnType<typeof vi.fn> }> = {}) {
  return {
    status: "anonymous" as const,
    user: null,
    teams: [],
    primaryTeam: null,
    reloadSession: vi.fn(),
    signIn: overrides.signIn ?? vi.fn(),
    signUp: overrides.signUp ?? vi.fn(),
    signOut: vi.fn(),
  };
}
