import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { api, ApiError, type SystemSettingsApi } from "@/lib/api";

export function SystemSettingsPanel() {
  const { showToast } = useAppActions();
  const [settings, setSettings] = useState<SystemSettingsApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSettings(await api.getSystemSettings());
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not load settings", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.updateSystemSettings(settings);
      setSettings(updated);
      showToast("System settings saved", "success");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading system settings…</p>
      </Card>
    );
  }

  if (!settings) return null;

  const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30";

  return (
    <section id="settings">
      <Card>
      <CardHeader
        title="System settings"
        subtitle="Hotel identity, OTP policy, session timeout, and audit logging"
        action={
          <Button size="sm" onClick={save} loading={saving} icon={<Icon name="Save" className="h-4 w-4" />}>
            Save
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Hotel name</span>
          <input
            value={settings.hotelName}
            onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Primary branch label</span>
          <input
            value={settings.branchDisplayName}
            onChange={(e) => setSettings({ ...settings, branchDisplayName: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Session timeout (minutes)</span>
          <input
            type="number"
            min={5}
            max={480}
            value={settings.sessionTimeoutMinutes}
            onChange={(e) =>
              setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })
            }
            className={inputClass}
          />
        </label>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-[var(--text-primary)]">OTP on login</p>
        {(
          [
            ["otpAdmin", "Administrators"],
            ["otpManagement", "Management"],
            ["otpFinance", "Finance"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] px-3 py-2.5">
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-default)]"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] px-3 py-2.5">
          <input
            type="checkbox"
            checked={settings.auditLoggingEnabled}
            onChange={(e) => setSettings({ ...settings, auditLoggingEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--border-default)]"
          />
          <span className="text-sm">Audit logging enabled</span>
        </label>
      </div>
    </Card>
    </section>
  );
}
