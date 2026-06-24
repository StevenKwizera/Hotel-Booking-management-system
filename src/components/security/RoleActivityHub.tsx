import { useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  ROLE_ACTIVITY_PROFILES,
  countActivitiesForRole,
} from "@/lib/user-activities";
import { routeForActivity } from "@/lib/activity-routes";
import type { UserRole } from "@/types";

interface RoleActivityHubProps {
  fixedRole?: UserRole;
  compact?: boolean;
}

export function RoleActivityHub({ fixedRole, compact }: RoleActivityHubProps) {
  const navigate = useNavigate();
  const profiles = fixedRole
    ? ROLE_ACTIVITY_PROFILES.filter((p) => p.role === fixedRole)
    : ROLE_ACTIVITY_PROFILES;

  if (compact && fixedRole) {
    const profile = profiles[0];
    if (!profile) return null;
    const total = countActivitiesForRole(fixedRole);
    return (
      <Card>
        <CardHeader
          title="Your operational activities"
          subtitle={`${total} classified activities — open the module for each`}
        />
        <div className="flex flex-wrap gap-2">
          {profile.categories.flatMap((c) =>
            c.activities.slice(0, 6).map((a) => (
              <Button
                key={a}
                size="sm"
                variant="outline"
                onClick={() => navigate(routeForActivity(fixedRole, a))}
              >
                {a}
              </Button>
            )),
          )}
          <Button size="sm" onClick={() => navigate("/workflows")}>
            Full journey
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {profiles.map((profile) => (
        <Card key={profile.role}>
          <CardHeader title={profile.title} subtitle={profile.summary} />
          <div className="grid gap-4 md:grid-cols-2">
            {profile.categories.map((cat) => (
              <div key={cat.title}>
                <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                  {cat.title}
                </h4>
                <ul className="space-y-1.5">
                  {cat.activities.map((activity) => (
                    <li key={activity}>
                      <button
                        type="button"
                        onClick={() => navigate(routeForActivity(profile.role, activity))}
                        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-left text-sm transition hover:border-sky-300/60 hover:bg-sky-50/50 dark:hover:border-sky-500/30 dark:hover:bg-sky-950/20"
                      >
                        <span>{activity}</span>
                        <Icon name="ArrowRight" className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
