import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Avatar } from "./Avatar";

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "active" : undefined)}>
      <span className="nav-dot" />
      {children}
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, primaryTeam, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Dashboard navigation">
        <Link className="brand" to="/dashboard">
          <span className="brand-mark mono">QA</span>
          <span>
            <strong>QA Dashboard</strong>
            <small>Team progress</small>
          </span>
        </Link>
        <nav className="side-nav">
          <NavItem to="/dashboard" end>
            Dashboard
          </NavItem>
          <NavItem to="/dashboard/insights">Insights</NavItem>
          <NavItem to="/dashboard/test-results">Test results</NavItem>
          <NavItem to="/dashboard/integrations">Integrations</NavItem>
          <NavItem to="/dashboard/goals/new">Create goal</NavItem>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={user?.displayName ?? user?.username ?? "?"} />
            <span style={{ minWidth: 0 }}>
              <strong>{user?.displayName ?? user?.username}</strong>
              <small>{primaryTeam?.name ?? "No team"}</small>
            </span>
          </div>
          <button className="button secondary" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="shell-main">{children}</div>
    </div>
  );
}
