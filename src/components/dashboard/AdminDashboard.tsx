import { useMemo } from "react";
import { Link } from "react-router-dom";
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
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { useBackendData } from "@/context/BackendDataContext";
import { useAppActions } from "@/context/AppActionsContext";
import {
  ADMIN_MODULE_TONES,
  ROLE_DASHBOARD_THEME,
  TONE_STYLES,
  toneAt,
  toneForKpi,
} from "@/lib/dashboard-theme";

const ADMIN_MODULES = [
  { title: "User management", description: "Staff accounts, roles & access", path: "/user-management", icon: "UserCog" },
  { title: "Guest directory", description: "Profiles, tiers & preferences", path: "/guests", icon: "Users" },
  { title: "Reports & analytics", description: "KPIs, charts & PDF exports", path: "/reports", icon: "BarChart3" },
  { title: "Reservations", description: "Bookings & availability", path: "/reservations", icon: "CalendarCheck" },
  { title: "Check-in / out", description: "Arrivals & departures", path: "/check-in-out", icon: "DoorOpen" },
  { title: "Payments", description: "Folios & transactions", path: "/payments", icon: "CreditCard" },
  { title: "Multi-hotel", description: "Branches & consolidation", path: "/multi-hotel", icon: "Building2" },
  { title: "Security", description: "Audit logs & access control", path: "/security", icon: "Shield" },
  { title: "Services", description: "Housekeeping & requests", path: "/services", icon: "ConciergeBell" },
  { title: "AI personalization", description: "Recommendations engine", path: "/ai-personalization", icon: "Sparkles" },
];

const PRIORITY_LINKS = [
  { label: "Create staff user", path: "/user-management", icon: "UserPlus", tone: "gold" as const },
  { label: "View guests", path: "/guests", icon: "Users", tone: "sapphire" as const },
  { label: "Open reports", path: "/reports", icon: "FileText", tone: "violet" as const },
  { label: "Role activities", path: "/security#activities", icon: "ListChecks", tone: "teal" as const },
  { label: "Audit trail", path: "/security", icon: "Shield", tone: "slate" as const },
] as const;

export function AdminDashboard() {
  const { hotelName, branchName } = useSettings();
  const { user } = useAuth();
  const {
    kpis,
    occupancy,
    branches,
    auditLogs,
    guests,
    bookings,
    availableRooms,
    loading,
  } = useBackendData();
  const { exportData } = useAppActions();
  const theme = ROLE_DASHBOARD_THEME.admin;

  const snapshot = useMemo(() => {
    const activeBookings = bookings.filter(
      (b) => b.status === "checked-in" || b.status === "confirmed",
    ).length;
    return {
      guests: guests.length,
      activeBookings,
      branches: branches.length,
      roomsAvailable: availableRooms,
    };
  }, [bookings, branches, guests.length, availableRooms]);

  const fallbackKpis = [
    { id: "g", label: "Registered guests", value: String(snapshot.guests), icon: "Users" },
    { id: "b", label: "Active bookings", value: String(snapshot.activeBookings), icon: "CalendarCheck" },
    { id: "r", label: "Rooms available", value: String(snapshot.roomsAvailable), icon: "Bed" },
    { id: "p", label: "Properties", value: String(snapshot.branches), icon: "Building2" },
  ];

  return (
    <div className="space-y-8">
      <DashboardHero
        role="admin"
        hotelName={hotelName}
        userName={user?.name}
        greeting="System overview"
        subtitle={`${branchName} — manage operations, staff, guests, and property performance from one control center.`}
      />

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Live metrics</h2>
            <p className="text-sm text-[var(--text-muted)]">Operational database — updated in real time</p>
          </div>
          <Link to="/reports">
            <Button variant="outline" size="sm" icon={<Icon name="BarChart3" className="h-4 w-4" />}>
              Full analytics
            </Button>
          </Link>
        </div>
        {loading && kpis.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Loading metrics…</p>
        ) : kpis.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((m, i) => (
              <StatCard key={m.id} metric={m} tone={toneForKpi("admin", i)} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {fallbackKpis.map((item, i) => (
              <KpiTile
                key={item.id}
                label={item.label}
                value={item.value}
                icon={item.icon}
                tone={toneForKpi("admin", i)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold text-[var(--text-primary)]">
              Control center
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ADMIN_MODULES.map((mod, i) => {
                const tone = toneAt(i, ADMIN_MODULE_TONES);
                const s = TONE_STYLES[tone];
                return (
                  <Link
                    key={mod.path}
                    to={mod.path}
                    className={`group flex items-start gap-4 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${s.border} ${s.cardBg}`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
                      <Icon name={mod.icon} className={`h-5 w-5 ${s.iconText}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)]">{mod.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{mod.description}</p>
                    </div>
                    <Icon
                      name="ChevronRight"
                      className="h-4 w-4 shrink-0 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          <Card>
            <CardHeader
              title="Occupancy trend"
              subtitle="Last 7 days — Net Luna Villa Kigali"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Icon name="Download" className="h-4 w-4" />}
                  onClick={() => exportData("orkestra-admin-occupancy.json", { occupancy, kpis })}
                  disabled={occupancy.length === 0}
                >
                  Export
                </Button>
              }
            />
            <div className="h-72">
              {occupancy.length === 0 ? (
                <EmptyState
                  icon="TrendingUp"
                  title="No chart data"
                  description="Metrics appear when the backend returns occupancy data."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={occupancy}>
                    <defs>
                      <linearGradient id="adminOcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.chartStroke} stopOpacity={0.4} />
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
                      fill="url(#adminOcc)"
                      name="Occupancy %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Quick actions
            </h3>
            <ul className="mt-3 space-y-1">
              {PRIORITY_LINKS.map((item) => {
                const s = TONE_STYLES[item.tone];
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition hover:shadow-sm ${s.border} ${s.cardBg}`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.iconBg}`}>
                        <Icon name={item.icon} className={`h-4 w-4 ${s.iconText}`} />
                      </span>
                      <span className="font-medium text-[var(--text-secondary)]">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          {branches.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Branches
              </h3>
              <ul className="mt-3 space-y-3">
                {branches.slice(0, 4).map((b, i) => {
                  const s = TONE_STYLES[toneAt(i, ["teal", "sapphire", "amber", "violet"])];
                  return (
                    <li
                      key={b.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${s.border}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {b.rooms} rooms · {b.occupancy}% occ.
                        </p>
                      </div>
                      <Badge variant={b.status === "online" ? "success" : "default"}>
                        {b.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
              <Link to="/multi-hotel" className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">
                  All properties
                </Button>
              </Link>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Recent activity
              </h3>
              <Link to="/security" className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400">
                View all
              </Link>
            </div>
            {auditLogs.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--text-muted)]">No audit entries yet.</p>
            ) : (
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {auditLogs.slice(0, 8).map((log, i) => (
                  <li
                    key={`${log.time}-${i}`}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-[var(--text-primary)]">{log.action}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {log.user} · {log.time}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
