import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { LiveRoleDashboard } from "@/components/dashboard/LiveRoleDashboard";

export function DashboardPage() {
  const { user } = useAuth();
  const role = user!.role;

  if (role === "admin") {
    return <AdminDashboard />;
  }

  return <LiveRoleDashboard />;
}
