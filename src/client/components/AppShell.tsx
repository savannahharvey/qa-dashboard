import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Dashboard navigation">
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">QA</span>
          <span>
            <strong>QA Dashboard</strong>
            <small>Team progress</small>
          </span>
        </Link>
        <nav className="side-nav">
          <NavLink to="/dashboard" end>
            Dashboard
          </NavLink>
          <NavLink to="/dashboard/test-results">Test results</NavLink>
          <NavLink to="/dashboard/goals/new">Create goal</NavLink>
        </nav>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Signed in</span>
            <strong>{user?.displayName ?? user?.username}</strong>
          </div>
          <button className="button secondary" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
