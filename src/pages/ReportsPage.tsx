import { AnalyticsSection } from "@/components/reports/AnalyticsSection";
import { ReportsHub } from "@/components/reports/ReportsHub";
import { OperationalDecisionsPanel } from "@/components/management/OperationalDecisionsPanel";
import { useAuth } from "@/context/AuthContext";
import { useHashScroll } from "@/hooks/useHashScroll";

export function ReportsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "management" || user?.role === "admin";
  useHashScroll();

  return (
    <div className="space-y-10">
      <AnalyticsSection />

      {isManager && <OperationalDecisionsPanel />}

      <div id="reports" className="border-t border-[var(--border-subtle)] pt-10">
        <div id="audit" className="space-y-10">
          <ReportsHub />
        </div>
      </div>
    </div>
  );
}
