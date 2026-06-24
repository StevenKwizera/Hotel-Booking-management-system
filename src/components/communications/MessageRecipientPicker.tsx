import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { MessageRecipientApi } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  guest: "Guests",
  receptionist: "Reception",
  staff: "Staff",
  finance: "Finance",
  management: "Management",
  admin: "Admin",
};

const ROLE_ORDER = ["receptionist", "admin", "management", "staff", "finance", "guest"];

interface MessageRecipientPickerProps {
  recipients: MessageRecipientApi[];
  value: string;
  onChange: (email: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function MessageRecipientPicker({
  recipients,
  value,
  onChange,
  loading = false,
  disabled = false,
}: MessageRecipientPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q),
    );
  }, [recipients, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, MessageRecipientApi[]>();
    for (const r of filtered) {
      const key = r.role;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return ROLE_ORDER.filter((role) => map.has(role)).map((role) => ({
      role,
      label: ROLE_LABELS[role] ?? role,
      users: map.get(role)!,
    }));
  }, [filtered]);

  const selected = recipients.find((r) => r.email === value);

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-sm font-medium text-[var(--text-secondary)]">Send to</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role…"
          disabled={disabled || loading}
          className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30 disabled:opacity-60"
        />
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading || recipients.length === 0}
        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30 disabled:opacity-60"
      >
        <option value="">
          {loading ? "Loading users…" : "Select who should receive this message"}
        </option>
        {grouped.map((group) => (
          <optgroup key={group.role} label={group.label}>
            {group.users.map((user) => (
              <option key={user.id} value={user.email}>
                {user.name} ({user.email})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {selected && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">{selected.name}</span>
          <Badge variant="info">{selected.role}</Badge>
          <span className="text-[var(--text-muted)]">{selected.email}</span>
        </div>
      )}

      {!loading && recipients.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">No users available to message.</p>
      )}
    </div>
  );
}
