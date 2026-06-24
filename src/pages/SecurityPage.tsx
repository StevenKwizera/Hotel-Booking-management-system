import { useCallback, useEffect, useState } from "react";

import { Link, useLocation } from "react-router-dom";

import { Card, CardHeader } from "@/components/ui/Card";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Icon } from "@/components/ui/Icon";

import { EmptyState } from "@/components/ui/EmptyState";

import { useAppActions } from "@/context/AppActionsContext";

import { useAuth } from "@/context/AuthContext";

import { useBackendData } from "@/context/BackendDataContext";

import { RoleActivityHub } from "@/components/security/RoleActivityHub";

import { SystemSettingsPanel } from "@/components/admin/SystemSettingsPanel";

import { BackupPanel } from "@/components/admin/BackupPanel";

import {

  ROLE_ACTIVITY_PROFILES,

  countActivitiesForRole,

  TOTAL_CLASSIFIED_ACTIVITIES,

} from "@/lib/user-activities";

import { ROLE_LABELS } from "@/lib/navigation";

import { api, ApiError, type AuditApi } from "@/lib/api";

import type { UserRole } from "@/types";



const roles: { role: UserRole; users: number; permissions: string }[] = [

  { role: "admin", users: 2, permissions: "Full system access" },

  { role: "management", users: 4, permissions: "Analytics, reports, guests" },

  { role: "receptionist", users: 8, permissions: "Bookings, check-in/out" },

  { role: "staff", users: 15, permissions: "Services & operations" },

  { role: "finance", users: 3, permissions: "Payments & financial reports" },

  { role: "guest", users: 0, permissions: "Self-service booking & profile" },

];



export function SecurityPage() {

  const { openModal, showToast, exportData } = useAppActions();

  const { user } = useAuth();

  const { auditLogs, loading } = useBackendData();

  const location = useLocation();

  const isAdmin = user?.role === "admin";



  const [securityLogs, setSecurityLogs] = useState<AuditApi[]>([]);

  const [securityLoading, setSecurityLoading] = useState(false);



  const loadSecurityLogs = useCallback(async () => {

    if (!isAdmin) return;

    setSecurityLoading(true);

    try {

      setSecurityLogs(await api.getSecurityLogs());

    } catch (e) {

      showToast(e instanceof ApiError ? e.message : "Could not load security logs", "error");

      setSecurityLogs([]);

    } finally {

      setSecurityLoading(false);

    }

  }, [isAdmin, showToast]);



  useEffect(() => {

    loadSecurityLogs();

  }, [loadSecurityLogs]);



  useEffect(() => {

    if (!location.hash) return;

    const id = location.hash.replace("#", "");

    const el = document.getElementById(id);

    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });

  }, [location.hash]);



  return (

    <div className="space-y-8">

      <section id="activities">

        <RoleActivityHub />

      </section>



      <Card className="flex flex-wrap items-center justify-between gap-4 border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5">

        <div>

          <p className="font-display text-lg font-semibold">Staff accounts</p>

          <p className="text-sm text-[var(--text-muted)]">

            Create users, assign roles, and view the full directory on User Management.

          </p>

        </div>

        <Link to="/user-management">

          <Button icon={<Icon name="UserCog" className="h-4 w-4" />}>Open user management</Button>

        </Link>

      </Card>



      <div className="grid gap-4 md:grid-cols-2">

        <section id="roles">
        <Card>

          <CardHeader

            title="Access Control"

            subtitle="Authentication & authorization"

            action={

              <Button size="sm" onClick={() => openModal("manage-roles")}>

                Manage Roles

              </Button>

            }

          />

          <ul className="space-y-3">

            {roles.map((r) => (

              <li

                key={r.role}

                className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2.5"

              >

                <div>

                  <p className="font-medium">{ROLE_LABELS[r.role]}</p>

                  <p className="text-xs text-[var(--text-muted)]">{r.permissions}</p>

                  <p className="mt-0.5 text-[10px] text-[var(--accent)]">

                    {countActivitiesForRole(r.role)} classified activities

                  </p>

                </div>

                <button

                  type="button"

                  onClick={() => openModal("manage-roles")}

                  className="cursor-pointer"

                >

                  <Badge>

                    {r.users > 0 ? `${r.users} users` : countActivitiesForRole(r.role)}

                  </Badge>

                </button>

              </li>

            ))}

          </ul>

          <p className="mt-4 text-center text-xs text-[var(--text-muted)]">

            {TOTAL_CLASSIFIED_ACTIVITIES} activities across {ROLE_ACTIVITY_PROFILES.length} roles

            — see classification above

          </p>

          {isAdmin && (

            <Link to="/user-management" className="mt-4 block">

              <Button variant="outline" size="sm" className="w-full">

                Assign roles on user accounts

              </Button>

            </Link>

          )}

        </Card>

        </section>



        <Card>

          <CardHeader title="Security Status" />

          <ul className="space-y-3">

            {[

              { label: "2FA / OTP enforcement", ok: true },

              { label: "Session timeout (30 min)", ok: true },

              { label: "Audit logging", ok: true },

              { label: "API rate limiting", ok: false },

            ].map((s) => (

              <li key={s.label}>

                <button

                  type="button"

                  onClick={() =>

                    showToast(

                      s.ok ? `${s.label} is enabled` : `${s.label} — configure in backend`,

                      s.ok ? "success" : "warning",

                    )

                  }

                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-left text-sm transition-colors hover:bg-[var(--bg-muted)]"

                >

                  <Icon

                    name={s.ok ? "CheckCircle2" : "AlertCircle"}

                    className={`h-4 w-4 ${s.ok ? "text-[var(--success)]" : "text-[var(--warning)]"}`}

                  />

                  {s.label}

                </button>

              </li>

            ))}

          </ul>

        </Card>

      </div>



      {isAdmin && (

        <>

          <SystemSettingsPanel />



          <section id="security-logs">
          <Card>

            <CardHeader

              title="Security logs"

              subtitle="Login, OTP, password, and privileged admin events"

              action={

                <Button

                  variant="outline"

                  size="sm"

                  icon={<Icon name="RefreshCw" className="h-4 w-4" />}

                  onClick={loadSecurityLogs}

                >

                  Refresh

                </Button>

              }

            />

            {securityLoading ? (

              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading…</p>

            ) : securityLogs.length === 0 ? (

              <EmptyState

                icon="Shield"

                title="No security events"

                description="Sign-ins and admin actions appear here when the API is connected."

              />

            ) : (

              <ul className="space-y-2">

                {securityLogs.map((log) => (

                  <li

                    key={`${log.user}-${log.action}-${log.time}`}

                    className="flex flex-wrap justify-between gap-2 rounded-lg border border-amber-200/50 bg-amber-50/50 px-4 py-3 text-sm dark:border-amber-500/20 dark:bg-amber-950/20"

                  >

                    <div>

                      <p className="font-medium">{log.action}</p>

                      <p className="text-[var(--text-muted)]">{log.user}</p>

                    </div>

                    <span className="text-[var(--text-muted)]">{log.time}</span>

                  </li>

                ))}

              </ul>

            )}

          </Card>

          </section>



          <BackupPanel />

        </>

      )}



      <Card>

        <CardHeader

          title="Audit Log"

          subtitle="All system actions — full compliance trail"

          action={

            <div className="flex gap-2">

              {isAdmin && (

                <Link to="/reports#audit">

                  <Button variant="outline" size="sm">

                    Audit reports

                  </Button>

                </Link>

              )}

              <Button

                variant="outline"

                size="sm"

                icon={<Icon name="Download" className="h-4 w-4" />}

                onClick={() => exportData("orkestra-audit-log.json", { auditLogs })}

              >

                Export log

              </Button>

            </div>

          }

        />

        {loading ? (

          <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading audit log…</p>

        ) : auditLogs.length === 0 ? (

          <EmptyState

            icon="ScrollText"

            title="No audit events yet"

            description="Admin actions and sign-ins are recorded here when the API is connected."

          />

        ) : (

          <ul className="space-y-2">

            {auditLogs.map((log) => (

              <li

                key={`${log.user}-${log.action}-${log.time}`}

                className="flex flex-wrap justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-sm"

              >

                <div>

                  <p className="font-medium">{log.action}</p>

                  <p className="text-[var(--text-muted)]">{log.user}</p>

                </div>

                <span className="text-[var(--text-muted)]">{log.time}</span>

              </li>

            ))}

          </ul>

        )}

      </Card>

    </div>

  );

}


