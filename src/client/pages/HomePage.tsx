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
          <span className="brand-mark">QA</span>
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
          <span className="eyebrow">Goals, ownership, and quality signals</span>
          <h1>QA Dashboard</h1>
          <p>
            Track team goals, individual ownership, progress, and QA metrics in one focused place so the next team
            conversation starts from shared evidence.
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
            <span />
            <span />
            <span />
          </div>
          <div className="preview-grid">
            <div>
              <strong>Unit coverage</strong>
              <b>82%</b>
            </div>
            <div>
              <strong>API tests</strong>
              <b>Passing</b>
            </div>
            <div>
              <strong>UI coverage</strong>
              <b>61%</b>
            </div>
          </div>
          <div className="preview-list">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    </main>
  );
}
