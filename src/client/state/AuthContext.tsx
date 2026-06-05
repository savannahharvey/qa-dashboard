import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentSession, signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp } from "../api";
import type { Team, User } from "../types";

type AuthStatus = "loading" | "anonymous" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  teams: Team[];
  primaryTeam: Team | null;
  reloadSession: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const applySession = useCallback((nextUser: User, nextTeams: Team[]) => {
    setUser(nextUser);
    setTeams(nextTeams);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setTeams([]);
    setStatus("anonymous");
  }, []);

  const reloadSession = useCallback(async () => {
    try {
      const session = await getCurrentSession();
      applySession(session.user, session.teams);
    } catch {
      clearSession();
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    void reloadSession();
  }, [reloadSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      teams,
      primaryTeam: teams[0] ?? null,
      reloadSession,
      async signIn(username, password) {
        const session = await apiSignIn(username, password);
        applySession(session.user, session.teams);
      },
      async signUp(username, password, displayName) {
        const session = await apiSignUp(username, password, displayName);
        applySession(session.user, []);
      },
      async signOut() {
        await apiSignOut();
        clearSession();
      },
    }),
    [applySession, clearSession, reloadSession, status, teams, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
