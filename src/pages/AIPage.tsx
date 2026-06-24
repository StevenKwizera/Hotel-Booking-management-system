import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  AiPipelinePanel,
  GuestAiAnalysisPanel,
  ManagementAiInsightsPanel,
} from "@/components/ai/AiPipelinePanel";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { useGuestData } from "@/context/GuestDataContext";
import { api, type AiOverviewApi, type AiStatsApi, type GuestInsightApi } from "@/lib/api";
import { useHashScroll } from "@/hooks/useHashScroll";

export function AIPage() {
  const { user } = useAuth();
  const { showToast } = useAppActions();
  const guest = useGuestData();
  const isGuest = user?.role === "guest";
  const isManagement = user?.role === "management" || user?.role === "admin";
  useHashScroll();

  const [overview, setOverview] = useState<AiOverviewApi | null>(null);
  const [insights, setInsights] = useState<GuestInsightApi[]>([]);
  const [stats, setStats] = useState<AiStatsApi | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const ov = await api.getAiOverview();
      setOverview(ov);
      if (!isGuest) {
        const [i, s] = await Promise.all([api.getAiInsights(), api.getAiStats()]);
        setInsights(i);
        setStats(s);
      }
    } catch {
      showToast("Connect to the API to load AI insights", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isGuest]);

  const refreshModels = async () => {
    try {
      await api.refreshAi();
      await load();
      if (isGuest) await guest.refresh();
      showToast("AI re-analyzed guest data and refreshed recommendations", "success");
    } catch {
      showToast("Could not refresh AI models", "error");
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-950 via-indigo-900 to-sky-900 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Orkestra AI module
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              How AI works at Net Luna Villa
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
              Collect guest and operational data → analyze patterns → recommend personalized offers →
              predict needs → forecast occupancy → optimize pricing and services.
            </p>
          </div>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={refreshModels}>
            Re-analyze data
          </Button>
        </div>
      </section>

      {!isGuest && stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiTile label="Active models" value={String(stats.activeModels)} icon="Cpu" tone="violet" />
          <KpiTile
            label="Guests with insights"
            value={String(stats.predictionsToday)}
            icon="Users"
            tone="sapphire"
          />
          <KpiTile
            label="Avg. confidence"
            value={`${stats.avgConfidence}%`}
            icon="Target"
            tone="amber"
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading AI pipeline…</p>
      ) : overview ? (
        <>
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">AI pipeline — live data</h2>
            <AiPipelinePanel pipeline={overview.pipeline} />
          </section>

          {isGuest && overview.guestAnalysis && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">Your AI analysis</h2>
              <GuestAiAnalysisPanel analysis={overview.guestAnalysis} />
            </section>
          )}

          {isManagement && overview.managementInsights && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">Management AI insights</h2>
              <ManagementAiInsightsPanel insights={overview.managementInsights} />
            </section>
          )}
        </>
      ) : null}

      <section id="ai-suggestions">
      <Card>
        <CardHeader
          title={isGuest ? "Your recommendations" : "Live guest recommendations"}
          subtitle="Generated from analyzed patterns — apply or save offers"
        />
        {isGuest ? (
          guest.recommendations.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No recommendations yet. Book a stay or update preferences, then click Re-analyze data.
            </p>
          ) : (
            <ul className="space-y-4">
              {guest.recommendations.map((rec) => (
                <li
                  key={rec.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <Icon name="Lightbulb" className="mt-0.5 h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{rec.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="success">{rec.confidence}% match</Badge>
                        {rec.applied && <Badge variant="info">Applied</Badge>}
                        {rec.saved && <Badge variant="default">Saved</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rec.saved}
                      onClick={() => {
                        guest.saveRecommendation(rec.id);
                        showToast(`"${rec.title}" saved`, "success");
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      disabled={rec.applied}
                      onClick={() => {
                        guest.applyRecommendation(rec.id);
                        showToast(`"${rec.title}" applied`, "success");
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : insights.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No insights in the database yet.</p>
        ) : (
          <ul className="space-y-4">
            {insights.map((rec) => (
              <li
                key={rec.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] p-4"
              >
                <div className="flex items-start gap-3">
                  <Icon name="Lightbulb" className="mt-0.5 h-5 w-5 text-violet-600" />
                  <div>
                    <p className="font-medium">{rec.guest}</p>
                    <p className="text-sm font-medium text-violet-700 dark:text-violet-300">{rec.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{rec.suggestion}</p>
                  </div>
                </div>
                <Badge variant="success">{rec.confidence}% match</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      </section>
    </div>
  );
}
