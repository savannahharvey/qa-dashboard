import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { AuthForm } from "./AuthForm";

export function SignUpPage() {
  const { status } = useAuth();
  return status === "authenticated" ? <Navigate to="/dashboard" replace /> : <AuthForm mode="sign-up" />;
}
