import { Icon } from "@/components/ui/Icon";
import { ROLE_DASHBOARD_THEME } from "@/lib/dashboard-theme";
import { ROLE_LABELS } from "@/lib/navigation";
import type { UserRole } from "@/types";

interface DashboardHeroProps {
  role: UserRole;
  hotelName: string;
  userName?: string;
  greeting: string;
  subtitle: string;
  badges?: { label: string; icon?: string }[];
}

export function DashboardHero({
  role,
  hotelName,
  userName,
  greeting,
  subtitle,
  badges = [],
}: DashboardHeroProps) {
  const theme = ROLE_DASHBOARD_THEME[role];
  const firstName = userName?.split(" ")[0];

  return (
    <section
      className={`overflow-hidden rounded-2xl border shadow-[var(--shadow-card)] ${theme.heroClass}`}
    >
      <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            {ROLE_LABELS[role]} · {hotelName}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            {firstName ? `Good day, ${firstName}` : greeting}
          </h1>
          {firstName && greeting && !greeting.toLowerCase().startsWith("good") && (
            <p className="mt-1 text-sm font-medium text-white/70">{greeting}</p>
          )}
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{subtitle}</p>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 lg:max-w-xs lg:flex-col lg:items-end">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${theme.badgeClass}`}
              >
                {b.icon && <Icon name={b.icon} className="h-3.5 w-3.5 opacity-90" />}
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
