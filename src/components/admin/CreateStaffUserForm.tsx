import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/navigation";
import type { UserRole } from "@/types";

const ADMIN_ROLES: UserRole[] = [
  "receptionist",
  "staff",
  "finance",
  "management",
  "admin",
];

const MANAGER_ROLES: UserRole[] = ["receptionist", "staff", "finance"];

interface CreateStaffUserFormProps {
  onCreated?: () => void;
}

export function CreateStaffUserForm({ onCreated }: CreateStaffUserFormProps = {}) {
  const { user } = useAuth();
  const { showToast } = useAppActions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("receptionist");
  const [loading, setLoading] = useState(false);

  if (!user || (user.role !== "admin" && user.role !== "management")) {
    return null;
  }

  const allowedRoles = user.role === "admin" ? ADMIN_ROLES : MANAGER_ROLES;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createStaffUser({ name, email, password, role });
      showToast(`Staff account created for ${email}`, "success");
      setName("");
      setEmail("");
      setPassword("");
      onCreated?.();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not create account", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Create staff account"
        subtitle={
          user.role === "admin"
            ? "Admin can create all hotel staff roles"
            : "Management can create Receptionist, Staff, and Finance accounts"
        }
      />
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--text-secondary)]">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          >
            {allowedRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--text-secondary)]">Temporary password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" loading={loading}>
            Create account
          </Button>
        </div>
      </form>
    </Card>
  );
}
