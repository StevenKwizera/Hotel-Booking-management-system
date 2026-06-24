import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api } from "@/lib/api";

export function OperationalDecisionsPanel() {
  const { showToast } = useAppActions();
  const { kpis, occupancy } = useBackendData();
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const overview = await api.getAiOverview();
        setAiInsights(overview.managementInsights?.strategicInsights ?? []);
      } catch {
        setAiInsights([]);
      }
    })();
  }, []);

  const kpiDecisions = useMemo(() => {
    const items: string[] = [];
    const occ = kpis.find((k) => k.label.toLowerCase().includes("occupancy"));
    const pending = kpis.find((k) => k.label.toLowerCase().includes("pending"));
    const rev = kpis.find((k) => k.label.toLowerCase().includes("revenue"));

    if (occ) {
      const val = parseInt(String(occ.value).replace(/[^\d]/g, ""), 10);
      if (!Number.isNaN(val) && val < 60) {
        items.push(
          `Occupancy at ${occ.value} — consider promotional packages or OTA campaigns for low-demand dates.`,
        );
      } else if (!Number.isNaN(val) && val >= 85) {
        items.push(
          `Strong occupancy (${occ.value}) — review dynamic pricing and upsell premium room categories.`,
        );
      }
    }
    if (pending && parseInt(String(pending.value).replace(/[^\d]/g, ""), 10) > 0) {
      items.push(
        `${pending.value} pending booking(s) — reception should confirm or release holds within 24 hours.`,
      );
    }
    if (rev) {
      items.push(`Revenue today: ${rev.value} — compare against weekly trend in the chart above.`);
    }
    if (occupancy.length >= 2) {
      const last = occupancy[occupancy.length - 1]?.occupancy ?? 0;
      const prev = occupancy[occupancy.length - 2]?.occupancy ?? 0;
      if (last < prev - 5) {
        items.push(
          "Occupancy dipped vs yesterday — review staff scheduling and marketing for the next 48 hours.",
        );
      }
    }
    return items;
  }, [kpis, occupancy]);

  const decisions = useMemo(() => {
    const merged = [...kpiDecisions, ...aiInsights];
    return merged.length > 0
      ? merged.slice(0, 6)
      : [
          "Review weekly KPI report and set targets for occupancy and guest satisfaction.",
          "Walk the floor with department heads — align housekeeping and front desk priorities.",
          "Check AI personalization module for upsell opportunities on high-value guests.",
        ];
  }, [kpiDecisions, aiInsights]);

  const exportDecisions = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ generatedAt: new Date().toISOString(), decisions }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orkestra-operational-decisions.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Decisions exported", "success");
  }, [decisions, showToast]);

  return (
    <section id="decisions">
      <Card>
        <CardHeader
          title="Operational decisions"
          subtitle="Data-driven actions from KPIs, trends, and AI strategic insights"
          action={
            <div className="flex gap-2">
              <Link to="/ai-personalization">
                <Button size="sm" variant="outline">
                  AI insights
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                icon={<Icon name="Download" className="h-4 w-4" />}
                onClick={exportDecisions}
              >
                Export
              </Button>
            </div>
          }
        />
        <ul className="space-y-3">
          {decisions.map((d) => (
            <li
              key={d}
              className="flex items-start gap-3 rounded-lg border border-teal-200/40 bg-teal-50/40 px-4 py-3 text-sm dark:border-teal-500/20 dark:bg-teal-950/20"
            >
              <Icon name="Lightbulb" className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="text-[var(--text-secondary)]">{d}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
