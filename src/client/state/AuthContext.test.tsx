// @vitest-environment jsdom

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import type { Team, User } from "../types";

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return {
    ...actual,
    getCurrentSession: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
});

import { getCurrentSession, signIn, signUp, signOut } from "../api";

describe("AuthContext", () => {
  it("hydrates the current session and updates authenticated state after sign-in and sign-out", async () => {
    const user = userEvent.setup();
    const sessionUser = {
      id: "user-sam",
      username: "sam",
      displayName: "Sam",
    } satisfies User;
    const team = {
      id: "team-qa",
      name: "QA Dashboard Team",
    } satisfies Team;
    vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: sessionUser, teams: [team] });
    vi.mocked(signIn).mockResolvedValueOnce({
      user: {
        id: "user-jordan",
        username: "jordan",
        displayName: "Jordan",
      },
      teams: [team],
    });
    vi.mocked(signOut).mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("sam")).toBeInTheDocument();
    expect(screen.getByText("team-qa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(signIn).toHaveBeenCalledWith("jordan", "password123");
    expect(await screen.findByText("jordan")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("anonymous")).toBeInTheDocument();
  });

  it("hydrates a new sign-up flow and keeps the browser state in sync", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentSession).mockRejectedValueOnce(new Error("No session"));
    vi.mocked(signUp).mockResolvedValueOnce({
      user: {
        id: "user-new",
        username: "newbie",
        displayName: "New User",
      },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("anonymous")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(signUp).toHaveBeenCalledWith("newbie", "password123", "New User");
    expect(await screen.findByText("newbie")).toBeInTheDocument();
    expect(screen.getByText("authenticated")).toBeInTheDocument();
  });
});

function AuthProbe() {
  const auth = useAuth();
  return (
    <section>
      <div>{auth.status}</div>
      <div>{auth.user?.username ?? "none"}</div>
      <div>{auth.teams.map((team) => team.id).join(",") || "none"}</div>
      <button type="button" onClick={() => void auth.signIn("jordan", "password123")}>
        Sign in
      </button>
      <button type="button" onClick={() => void auth.signUp("newbie", "password123", "New User")}>
        Sign up
      </button>
      <button type="button" onClick={() => void auth.signOut()}>
        Sign out
      </button>
    </section>
  );
}
