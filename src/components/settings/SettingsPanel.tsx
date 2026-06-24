import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/context/SettingsContext";
import type { AccentColor, Density, ThemeMode } from "@/types";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const ACCENTS: { id: AccentColor; label: string; color: string }[] = [
  { id: "emerald", label: "Forest Green (default)", color: "oklch(0.38 0.1 155)" },
  { id: "gold", label: "Champagne Gold", color: "oklch(0.72 0.16 72)" },
  { id: "sapphire", label: "Sapphire", color: "oklch(0.58 0.14 250)" },
  { id: "rose", label: "Rose", color: "oklch(0.62 0.16 15)" },
];

const DENSITIES: { id: Density; label: string }[] = [
  { id: "compact", label: "Compact" },
  { id: "comfortable", label: "Comfortable" },
  { id: "spacious", label: "Spacious" },
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    theme,
    accent,
    density,
    hotelName,
    branchName,
    setTheme,
    setAccent,
    setDensity,
    setHotelName,
    setBranchName,
    resetSettings,
  } = useSettings();

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl"
        role="dialog"
        aria-label="Customization settings"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-semibold">Customize Orkestra</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Theme, branding & layout preferences
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-[var(--bg-muted)]"
            aria-label="Close"
          >
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Live preview
            </p>
            <p className="mt-2 font-display text-lg font-semibold text-[var(--accent)]">
              {hotelName}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{branchName}</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {theme} theme · {accent} accent · {density} layout
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Appearance
            </h3>
            <div className="flex gap-2">
              {(["light", "dark"] as ThemeMode[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm capitalize transition-all ${
                    theme === t
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border-default)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  <Icon name={t === "light" ? "Sun" : "Moon"} className="h-4 w-4" />
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Accent Color
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccent(a.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                    accent === a.id
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20"
                      : "border-[var(--border-default)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full"
                    style={{ background: a.color }}
                  />
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Layout Density
            </h3>
            <div className="flex gap-2">
              {DENSITIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDensity(d.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                    density === d.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border-default)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Branding
            </h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-[var(--text-secondary)]">Hotel name</span>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </label>
              <label className="block">
                <span className="text-sm text-[var(--text-secondary)]">Branch</span>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="border-t border-[var(--border-subtle)] px-6 py-4">
          <Button variant="outline" className="w-full" onClick={resetSettings}>
            Reset to defaults
          </Button>
        </div>
      </aside>
    </>
  );
}
