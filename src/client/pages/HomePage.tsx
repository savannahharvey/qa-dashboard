import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function HomePage() {
  const { status } = useAuth();

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="public-page">
      <nav className="public-nav" aria-label="Public navigation">
        <Link className="brand" to="/">
          <span className="brand-mark mono">QA</span>
          <strong>QA Dashboard</strong>
        </Link>
        <div>
          <Link className="button secondary" to="/sign-in">
            Sign in
          </Link>
          <Link className="button" to="/sign-up">
            Sign up
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Goals · Ownership · Quality signals</span>
          <h1>Every test signal, next to the goal it supports.</h1>
          <p>
            Track team goals, individual ownership, and QA coverage in one focused place — so the next conversation
            starts from shared evidence, not scattered spreadsheets.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/sign-up">
              Create account
            </Link>
            <Link className="button secondary" to="/sign-in">
              Sign in
            </Link>
          </div>
        </div>
        <div className="dashboard-preview" aria-label="Dashboard preview">
          <div className="preview-header">
            <span>Suite health</span>
          </div>
          <div className="preview-grid">
            <div>
              <strong>Pass rate</strong>
              <b>–</b>
            </div>
            <div>
              <strong>Avg coverage</strong>
              <b>–</b>
            </div>
            <div>
              <strong>At risk</strong>
              <b>–</b>
            </div>
          </div>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Your team's numbers show up here once you create a team and connect a test source.
          </p>
        </div>
      </section>
    </main>
  );
}
