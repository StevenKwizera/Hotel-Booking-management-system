import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/context/AuthContext";

type DemoLoginHintProps = {
  variant?: "hero" | "card" | "section";
};

export function DemoLoginHint({ variant = "card" }: DemoLoginHintProps) {
  if (variant === "section") {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Try the demo
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
              Sign in with any role below
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Shared password:{" "}
              <code className="rounded-md bg-white px-2 py-0.5 font-mono text-sm font-semibold text-[var(--accent)] shadow-sm">
                {DEMO_PASSWORD}
              </code>
            </p>
          </div>
          <div className="grid w-full gap-2 sm:max-w-md sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((a) => (
              <div
                key={a.role}
                className="rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5"
              >
                <p className="text-xs font-medium text-[var(--text-muted)]">{a.label}</p>
                <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-primary)] sm:text-sm">
                  {a.email}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="mt-6 max-w-xl rounded-xl border border-white/20 bg-black/40 px-4 py-3 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
          Demo sign-in
        </p>
        <p className="mt-1.5 text-sm text-white/90">
          Password{" "}
          <code className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-white">
            {DEMO_PASSWORD}
          </code>
          {" · "}
          e.g. <code className="font-mono text-white/95">guest@orkestra.com</code>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-4 py-3 text-sm">
      <p className="font-medium text-[var(--text-primary)]">Demo accounts</p>
      <p className="mt-1 text-[var(--text-secondary)]">
        Password for all accounts:{" "}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[var(--accent)]">
          {DEMO_PASSWORD}
        </code>
      </p>
      <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.role} className="flex flex-wrap justify-between gap-x-2 gap-y-0.5">
            <span className="font-medium text-[var(--text-secondary)]">{a.label}</span>
            <code className="font-mono text-[var(--text-primary)]">{a.email}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
