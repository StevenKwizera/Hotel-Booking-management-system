import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import {
  ROLE_ACTIVITY_PROFILES,
  countActivitiesForRole,
  TOTAL_CLASSIFIED_ACTIVITIES,
  type RoleActivityProfile,
} from "@/lib/user-activities";
import { ROLE_LABELS } from "@/lib/navigation";
import type { UserRole } from "@/types";

const ROLE_ICONS: Record<UserRole, string> = {
  guest: "User",
  receptionist: "ConciergeBell",
  staff: "Sparkles",
  finance: "CircleDollarSign",
  management: "BarChart3",
  admin: "Shield",
};

type RoleActivitiesMatrixProps = {
  /** If set, only this role is shown (no role tabs) */
  fixedRole?: UserRole;
  compact?: boolean;
};

export function RoleActivitiesMatrix({ fixedRole, compact = false }: RoleActivitiesMatrixProps) {
  const roles = ROLE_ACTIVITY_PROFILES.map((p) => p.role);
  const [activeRole, setActiveRole] = useState<UserRole>(fixedRole ?? "guest");

  const selectedRole = fixedRole ?? activeRole;
  const profile = useMemo(
    () => ROLE_ACTIVITY_PROFILES.find((p) => p.role === selectedRole),
    [selectedRole],
  );

  if (!profile) return null;

  return (
    <div className="space-y-5">
      {!fixedRole && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              User activities classification
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Orkestra Hospitality — {TOTAL_CLASSIFIED_ACTIVITIES} activities across{" "}
              {ROLE_ACTIVITY_PROFILES.length} roles
            </p>
          </div>
        </div>
      )}

      {!fixedRole && (
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setActiveRole(role)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                selectedRole === role
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40"
              }`}
            >
              <Icon name={ROLE_ICONS[role]} className="h-3.5 w-3.5" />
              {ROLE_LABELS[role]}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  selectedRole === role ? "bg-white/20" : "bg-[var(--bg-muted)]"
                }`}
              >
                {countActivitiesForRole(role)}
              </span>
            </button>
          ))}
        </div>
      )}

      <RoleActivityPanel profile={profile} compact={compact} />
    </div>
  );
}

function RoleActivityPanel({
  profile,
  compact,
}: {
  profile: RoleActivityProfile;
  compact?: boolean;
}) {
  const activityCount = countActivitiesForRole(profile.role);

  return (
    <Card className="overflow-hidden border-[var(--border-subtle)]">
      <div className="border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--sidebar-bg)] to-[var(--accent)]/25 px-5 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Icon name={ROLE_ICONS[profile.role]} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">{profile.title}</h3>
              <p className="mt-0.5 text-sm text-white/80">{profile.summary}</p>
            </div>
          </div>
          <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white">
            {activityCount} activities · {profile.categories.length} categories
          </span>
        </div>
      </div>

      <div
        className={`grid gap-4 p-5 sm:p-6 ${
          compact ? "sm:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {profile.categories.map((category) => (
          <div
            key={category.title}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              {category.title}
            </p>
            <ul className="mt-3 space-y-2">
              {category.activities.map((activity) => (
                <li
                  key={activity}
                  className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <Icon
                    name="Check"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
                  />
                  {activity}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
