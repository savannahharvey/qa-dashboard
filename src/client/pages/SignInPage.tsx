import { Navigate } from "react-router-dom";
import { AuthForm } from "./AuthForm";
import { useAuth } from "../state/AuthContext";

export function SignInPage() {
  const { status } = useAuth();
  return status === "authenticated" ? <Navigate to="/dashboard" replace /> : <AuthForm mode="sign-in" />;
}
