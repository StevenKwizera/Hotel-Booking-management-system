import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateStaffUserForm } from "@/components/admin/CreateStaffUserForm";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError, type UserListItemApi } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/navigation";
import type { UserRole } from "@/types";

const STAFF_ROLES: UserRole[] = [
  "admin",
  "management",
  "receptionist",
  "staff",
  "finance",
  "guest",
];

export function UserManagementPage() {
  const { user } = useAuth();
  const { showToast, navigateTo } = useAppActions();
  const [users, setUsers] = useState<UserListItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not load users", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of STAFF_ROLES) counts[r] = 0;
    for (const u of users) {
      counts[u.role] = (counts[u.role] ?? 0) + 1;
    }
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const isAdmin = user?.role === "admin";
  const canManageUsers = user?.role === "admin" || user?.role === "management";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-r from-[var(--sidebar-bg)] to-[var(--accent)]/30 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
              <Icon name="Users" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
                Admin · User management
              </p>
              <h2 className="font-display text-2xl font-semibold">System users</h2>
              <p className="text-sm text-white/85">
                Create staff accounts, view roles, and manage hotel access
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              icon={<Icon name="RefreshCw" className="h-4 w-4" />}
              onClick={loadUsers}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              icon={<Icon name="Shield" className="h-4 w-4" />}
              onClick={() => navigateTo("/security")}
            >
              Security & audit
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {STAFF_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRoleFilter(roleFilter === r ? "all" : r)}
            className={`rounded-xl border p-3 text-left transition-all ${
              roleFilter === r
                ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20"
                : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/30"
            }`}
          >
            <p className="text-2xl font-semibold">{roleCounts[r] ?? 0}</p>
            <p className="text-xs text-[var(--text-muted)]">{ROLE_LABELS[r]}</p>
          </button>
        ))}
      </div>

      {canManageUsers && (
        <CreateStaffUserForm onCreated={loadUsers} />
      )}

      <Card>
        <CardHeader
          title="User directory"
          subtitle={`${filtered.length} of ${users.length} accounts`}
          action={
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2">
              <Icon name="Search" className="h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="w-40 bg-transparent text-sm outline-none sm:w-52"
              />
            </div>
          }
        />

        {loading ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">Loading users…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="Users"
            title="No users found"
            description={
              users.length === 0
                ? "Start the API to load accounts from the database."
                : "Try a different search or filter."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Branch</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  {isAdmin && <th className="px-3 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-muted)]/50"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xs font-semibold text-[var(--accent)]">
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{u.email}</td>
                    <td className="px-3 py-3">
                      <Badge variant={u.role === "admin" ? "warning" : "default"}>
                        {ROLE_LABELS[u.role as UserRole] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-muted)]">{u.branchName}</td>
                    <td className="px-3 py-3">
                      <Badge variant={u.enabled ? "success" : "danger"}>
                        {u.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-muted)]">{u.createdAt}</td>
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={u.enabled ? "outline" : "primary"}
                            onClick={async () => {
                              try {
                                await api.updateUser(u.id, { enabled: !u.enabled });
                                showToast(u.enabled ? "User disabled" : "User enabled", "success");
                                loadUsers();
                              } catch (e) {
                                showToast(e instanceof ApiError ? e.message : "Update failed", "error");
                              }
                            }}
                          >
                            {u.enabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await api.resetUserPassword(u.id, "password123");
                                showToast(`Password reset for ${u.email}`, "success");
                              } catch (e) {
                                showToast(e instanceof ApiError ? e.message : "Reset failed", "error");
                              }
                            }}
                          >
                            Reset password
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const nextRole = window.prompt(
                                "Enter new role (admin, management, receptionist, staff, finance, guest)",
                                u.role,
                              );
                              if (!nextRole) return;
                              try {
                                await api.updateUser(u.id, { role: nextRole });
                                showToast(`Role updated to ${nextRole}`, "success");
                                loadUsers();
                              } catch (e) {
                                showToast(e instanceof ApiError ? e.message : "Role update failed", "error");
                              }
                            }}
                          >
                            Change role
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () => {
                              const ok = window.confirm(`Delete user ${u.email}? This is permanent.`);
                              if (!ok) return;
                              try {
                                await api.deleteUser(u.id);
                                showToast(`Deleted ${u.email}`, "success");
                                loadUsers();
                              } catch (e) {
                                showToast(e instanceof ApiError ? e.message : "Delete failed", "error");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
