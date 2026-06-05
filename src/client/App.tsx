import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { CreateGoalPage } from "./pages/CreateGoalPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { useAuth } from "./state/AuthContext";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/goals/new"
        element={
          <RequireAuth>
            <CreateGoalPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <main className="page center-page">
        <p className="muted">Checking your session...</p>
      </main>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}
