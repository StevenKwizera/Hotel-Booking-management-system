import { Icon } from "@/components/ui/Icon";
import { TONE_STYLES, type DashTone } from "@/lib/dashboard-theme";

interface QuickActionButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  tone?: DashTone;
}

export function QuickActionButton({ label, icon, onClick, tone = "slate" }: QuickActionButtonProps) {
  const s = TONE_STYLES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${s.border} ${s.cardBg}`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${s.iconBg} group-hover:scale-105`}>
        <Icon name={icon} className={`h-5 w-5 ${s.iconText}`} />
      </span>
      <span className="text-xs font-medium leading-tight text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
        {label}
      </span>
    </button>
  );
}
