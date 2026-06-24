import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface RoleGateProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export function RoleGate({ roles, children }: RoleGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--text-muted)]">Checking access…</p>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
