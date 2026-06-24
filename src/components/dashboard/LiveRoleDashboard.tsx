import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { GuestDashboardPanels } from "@/components/dashboard/GuestDashboardPanels";
import { GuestBookingStatusBanner } from "@/components/booking/GuestBookingStatusBanner";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { DashboardTaskList } from "@/components/dashboard/DashboardTaskList";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { BookingApprovalPanel } from "@/components/reception/BookingApprovalPanel";
import { api, type RoleDashboardApi } from "@/lib/api";
import {
  ROLE_DASHBOARD_THEME,
  TONE_STYLES,
  toneAt,
  toneForKpi,
  type DashTone,
} from "@/lib/dashboard-theme";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { useBackendData } from "@/context/BackendDataContext";
import { useGuestData } from "@/context/GuestDataContext";
import { useAppActions } from "@/context/AppActionsContext";
import { useHashScroll } from "@/hooks/useHashScroll";
import type { UserRole } from "@/types";

const QUICK_BY_ROLE: Record<
  UserRole,
  { label: string; icon: string; path: string; tone: DashTone }[]
> = {
  guest: [
    { label: "Book room", icon: "CalendarPlus", path: "/reservations", tone: "sapphire" },
    { label: "Dining menu", icon: "UtensilsCrossed", path: "/dining", tone: "gold" },
    { label: "Pay bill", icon: "CreditCard", path: "/payments", tone: "gold" },
    { label: "Feedback", icon: "Star", path: "/feedback", tone: "gold" },
  ],
  receptionist: [
    { label: "Check-in", icon: "DoorOpen", path: "/check-in-out", tone: "sapphire" },
    { label: "Meal orders", icon: "UtensilsCrossed", path: "/dining", tone: "gold" },
    { label: "Guests", icon: "Users", path: "/guests", tone: "slate" },
    { label: "Feedback", icon: "Star", path: "/feedback", tone: "gold" },
  ],
  staff: [
    { label: "Meal orders", icon: "UtensilsCrossed", path: "/dining", tone: "gold" },
    { label: "Service queue", icon: "ConciergeBell", path: "/services", tone: "sapphire" },
    { label: "Reports", icon: "FileText", path: "/reports", tone: "teal" },
    { label: "My tasks", icon: "ListChecks", path: "/services", tone: "sapphire" },
    { label: "Messages", icon: "MessageSquare", path: "/communications", tone: "slate" },
  ],
  finance: [
    { label: "Payments", icon: "CreditCard", path: "/payments", tone: "violet" },
    { label: "Reports", icon: "FileText", path: "/reports", tone: "sapphire" },
    { label: "Reconcile", icon: "RefreshCw", path: "/payments", tone: "gold" },
    { label: "Analytics", icon: "BarChart3", path: "/reports", tone: "teal" },
  ],
  management: [
    { label: "Reports", icon: "BarChart3", path: "/reports", tone: "violet" },
    { label: "Feedback", icon: "Star", path: "/feedback", tone: "gold" },
    { label: "Guests", icon: "Users", path: "/guests", tone: "sapphire" },
    { label: "AI insights", icon: "Sparkles", path: "/ai-personalization", tone: "gold" },
  ],
  admin: [
    { label: "Users", icon: "UserCog", path: "/user-management", tone: "gold" },
    { label: "Feedback", icon: "Star", path: "/feedback", tone: "gold" },
    { label: "Security", icon: "Shield", path: "/security", tone: "violet" },
    { label: "Reports", icon: "BarChart3", path: "/reports", tone: "sapphire" },
  ],
};

export function LiveRoleDashboard() {
  const { user } = useAuth();
  const { hotelName } = useSettings();
  const backend = useBackendData();
  const guest = useGuestData();
  const { openModal } = useAppActions();
  const navigate = useNavigate();
  useHashScroll();
  const role = user!.role;
  const theme = ROLE_DASHBOARD_THEME[role];
  const isFrontDesk = role === "receptionist" || role === "admin" || role === "management";
  const [dash, setDash] = useState<RoleDashboardApi | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getRoleDashboard();
      setDash(data);
    } catch {
      setDash(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadDashboard();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [role, loadDashboard]);

  useEffect(() => {
    if (!isFrontDesk) return;
    const timer = setInterval(async () => {
      await backend.refresh();
      await loadDashboard();
    }, 10000);
    const onUpdate = () => {
      void backend.refresh();
      void loadDashboard();
    };
    window.addEventListener("orkestra:bookings-updated", onUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener("orkestra:bookings-updated", onUpdate);
    };
  }, [isFrontDesk, backend, loadDashboard]);

  const quickActions = QUICK_BY_ROLE[role];

  const heroBadges = useMemo(() => {
    const items: { label: string; icon?: string }[] = [];
    if (role !== "guest") return items;
    const active =
      guest.bookings.find((b) => b.status === "checked-in") ??
      guest.bookings.find((b) => b.status === "confirmed");
    if (active) {
      items.push({ label: `Ref ${active.id}`, icon: "Hash" });
      if (guest.room !== "—") {
        items.push({ label: `Room ${guest.room}`, icon: "Bed" });
      }
    }
    if (guest.balance > 0) {
      items.push({ label: `Balance RWF ${guest.balance.toLocaleString()}`, icon: "Wallet" });
    }
    if (guest.unreadCount > 0) {
      items.push({ label: `${guest.unreadCount} unread`, icon: "Bell" });
    }
    return items;
  }, [role, guest.balance, guest.bookings, guest.room, guest.unreadCount]);

  return (
    <div className="space-y-8">
      <DashboardHero
        role={role}
        hotelName={hotelName}
        userName={user?.name}
        greeting={dash?.greeting ?? "Dashboard"}
        subtitle={dash?.subtitle ?? "Live operational data from Orkestra"}
        badges={heroBadges}
      />

      {role === "guest" && (
        <>
          <GuestBookingStatusBanner />
          <GuestDashboardPanels />
        </>
      )}

      {isFrontDesk && (
        <section id="pending-approvals">
          <BookingApprovalPanel />
        </section>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]"
            />
          ))}
        </div>
      ) : (
        <>
          {dash && dash.kpis.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Key metrics
              </h2>
              <div
                className={`grid gap-4 sm:grid-cols-2 ${
                  role === "guest" ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3"
                }`}
              >
                {dash.kpis.map((k, i) => (
                  <KpiTile
                    key={k.id}
                    label={k.label}
                    value={k.value}
                    icon={k.icon}
                    tone={toneForKpi(role, i)}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
            <DashboardTaskList
              tasks={dash?.tasks ?? []}
              toneCycle={theme.kpiCycle}
            />

            <aside className="space-y-6">
              <Card className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Quick actions
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {quickActions.map((qa) => (
                    <QuickActionButton
                      key={qa.label}
                      label={qa.label}
                      icon={qa.icon}
                      tone={qa.tone}
                      onClick={() => navigate(qa.path)}
                    />
                  ))}
                </div>
              </Card>

              {isFrontDesk && (
                <Card className="p-4">
                  <CardHeader
                    title="Booking alerts"
                    subtitle={`${backend.notifications.filter((n) => !n.read && n.category === "booking").length} new`}
                  />
                  {backend.notifications.filter((n) => n.category === "booking").length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No booking alerts yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {backend.notifications
                        .filter((n) => n.category === "booking")
                        .slice(0, 4)
                        .map((n, i) => {
                          const s = TONE_STYLES[toneAt(i, theme.kpiCycle)];
                          return (
                            <li
                              key={n.id}
                              className={`rounded-lg border px-3 py-2 ${
                                !n.read ? `${s.border} ${s.cardBg}` : "border-[var(--border-subtle)]"
                              }`}
                            >
                              <p className="text-sm font-medium">{n.title}</p>
                              <p className="text-xs text-[var(--text-muted)] line-clamp-2">{n.body}</p>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => navigate("/communications")}
                  >
                    All notifications
                  </Button>
                </Card>
              )}

              {role === "guest" && (
                <Card className="p-4">
                  <CardHeader
                    title="Recent alerts"
                    subtitle={`${guest.unreadCount} unread`}
                    action={
                      <Button variant="ghost" size="sm" onClick={() => openModal("notifications")}>
                        All
                      </Button>
                    }
                  />
                  {guest.notifications.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No alerts yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {guest.notifications.slice(0, 4).map((n, i) => {
                        const s = TONE_STYLES[toneAt(i, theme.kpiCycle)];
                        return (
                          <li
                            key={n.id}
                            className={`rounded-lg border px-3 py-2 ${
                              !n.read ? `${s.border} ${s.cardBg}` : "border-[var(--border-subtle)]"
                            }`}
                          >
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-[var(--text-muted)] line-clamp-2">{n.body}</p>
                            {!n.read && (
                              <span className="mt-1 inline-block">
                                <Badge variant="info">New</Badge>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => navigate("/communications")}
                  >
                    Open communications
                  </Button>
                </Card>
              )}
            </aside>
          </div>
        </>
      )}

      {role === "management" && backend.kpis.length > 0 && (
        <section id="kpis" className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
            Executive analytics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {backend.kpis.map((m, i) => (
              <StatCard key={m.id} metric={m} tone={toneForKpi(role, i)} />
            ))}
          </div>
          <Card>
            <CardHeader title="Occupancy & revenue" subtitle="Last 7 days — all properties" />
            <div className="h-72">
              {backend.occupancy.length === 0 ? (
                <EmptyState icon="TrendingUp" title="No data" description="" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={backend.occupancy}>
                    <defs>
                      <linearGradient id="mgmtOcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.chartStroke} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={theme.chartStroke} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-default)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="occupancy"
                      stroke={theme.chartStroke}
                      strokeWidth={2}
                      fill="url(#mgmtOcc)"
                      name="Occupancy %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
