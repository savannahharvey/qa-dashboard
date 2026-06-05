import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../state/AuthContext";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFields({});

    try {
      if (isSignUp) {
        await signUp(username, password, displayName);
      } else {
        await signIn(username, password);
      }
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFields(err.fields);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand" to="/">
          <span className="brand-mark">QA</span>
          <strong>QA Dashboard</strong>
        </Link>
        <div>
          <span className="eyebrow">{isSignUp ? "Create account" : "Welcome back"}</span>
          <h1>{isSignUp ? "Sign up" : "Sign in"}</h1>
          <p className="muted">
            {isSignUp
              ? "Create an account, then join your team from the dashboard."
              : "Use your team account to open the protected dashboard."}
          </p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            {fields.username ? <span className="field-error">{fields.username}</span> : null}
          </label>
          {isSignUp ? (
            <label>
              Display name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />
            </label>
          ) : null}
          <label>
            Password
            <input
              value={password}
              type="password"
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            {fields.password ? <span className="field-error">{fields.password}</span> : null}
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Working..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="muted">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <Link to={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Sign up"}</Link>
        </p>
      </section>
    </main>
  );
}
