import type { UserRole } from "@/types";

/** Accent tones used across dashboards (not all green) */
export type DashTone =
  | "sapphire"
  | "teal"
  | "amber"
  | "violet"
  | "rose"
  | "slate"
  | "gold"
  | "coral";

export const TONE_STYLES: Record<
  DashTone,
  { iconBg: string; iconText: string; border: string; cardBg: string; ring: string }
> = {
  sapphire: {
    iconBg: "bg-sky-500/15",
    iconText: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200/80 dark:border-sky-500/30",
    cardBg: "bg-gradient-to-br from-sky-50/90 to-white dark:from-sky-950/40 dark:to-[var(--bg-surface)]",
    ring: "ring-sky-500/20",
  },
  teal: {
    iconBg: "bg-teal-500/15",
    iconText: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200/80 dark:border-teal-500/30",
    cardBg: "bg-gradient-to-br from-teal-50/90 to-white dark:from-teal-950/40 dark:to-[var(--bg-surface)]",
    ring: "ring-teal-500/20",
  },
  amber: {
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-500/30",
    cardBg: "bg-gradient-to-br from-amber-50/90 to-white dark:from-amber-950/40 dark:to-[var(--bg-surface)]",
    ring: "ring-amber-500/20",
  },
  violet: {
    iconBg: "bg-violet-500/15",
    iconText: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200/80 dark:border-violet-500/30",
    cardBg: "bg-gradient-to-br from-violet-50/90 to-white dark:from-violet-950/40 dark:to-[var(--bg-surface)]",
    ring: "ring-violet-500/20",
  },
  rose: {
    iconBg: "bg-rose-500/15",
    iconText: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-500/30",
    cardBg: "bg-gradient-to-br from-rose-50/90 to-white dark:from-rose-950/40 dark:to-[var(--bg-surface)]",
    ring: "ring-rose-500/20",
  },
  slate: {
    iconBg: "bg-slate-500/15",
    iconText: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200/80 dark:border-slate-500/30",
    cardBg: "bg-gradient-to-br from-slate-50/90 to-white dark:from-slate-900/50 dark:to-[var(--bg-surface)]",
    ring: "ring-slate-500/20",
  },
  gold: {
    iconBg: "bg-yellow-500/15",
    iconText: "text-yellow-800 dark:text-yellow-300",
    border: "border-yellow-200/80 dark:border-yellow-500/30",
    cardBg: "bg-gradient-to-br from-yellow-50/90 to-white dark:from-yellow-950/30 dark:to-[var(--bg-surface)]",
    ring: "ring-yellow-500/20",
  },
  coral: {
    iconBg: "bg-orange-500/15",
    iconText: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200/80 dark:border-orange-500/30",
    cardBg: "bg-gradient-to-br from-orange-50/90 to-white dark:from-orange-950/40 dark:to-[var(--bg-surface)]",
    ring: "ring-orange-500/20",
  },
};

export interface RoleDashboardTheme {
  heroClass: string;
  badgeClass: string;
  kpiCycle: DashTone[];
  chartStroke: string;
  chartFill: string;
}

export const ROLE_DASHBOARD_THEME: Record<UserRole, RoleDashboardTheme> = {
  guest: {
    heroClass:
      "bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-900 text-white border-sky-700/30",
    badgeClass: "bg-sky-400/25 text-sky-50 border-sky-300/20",
    kpiCycle: ["sapphire", "gold", "teal"],
    chartStroke: "#0ea5e9",
    chartFill: "#0ea5e9",
  },
  receptionist: {
    heroClass:
      "bg-gradient-to-br from-blue-950 via-blue-800 to-sky-700 text-white border-blue-700/30",
    badgeClass: "bg-white/20 text-white border-white/30",
    kpiCycle: ["sapphire", "slate", "teal"],
    chartStroke: "#2563eb",
    chartFill: "#3b82f6",
  },
  staff: {
    heroClass:
      "bg-gradient-to-br from-blue-950 via-blue-800 to-sky-600 text-white border-blue-700/30",
    badgeClass: "bg-white/20 text-white border-white/30",
    kpiCycle: ["sapphire", "sapphire", "slate"],
    chartStroke: "#2563eb",
    chartFill: "#3b82f6",
  },
  finance: {
    heroClass:
      "bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 text-white border-violet-700/30",
    badgeClass: "bg-violet-400/25 text-violet-50 border-violet-300/20",
    kpiCycle: ["violet", "gold", "sapphire"],
    chartStroke: "#8b5cf6",
    chartFill: "#8b5cf6",
  },
  management: {
    heroClass:
      "bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-900 text-white border-indigo-700/30",
    badgeClass: "bg-indigo-400/25 text-indigo-50 border-indigo-300/20",
    kpiCycle: ["violet", "sapphire", "gold", "teal"],
    chartStroke: "#6366f1",
    chartFill: "#6366f1",
  },
  admin: {
    heroClass:
      "bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white border-slate-600/40",
    badgeClass: "bg-amber-400/20 text-amber-100 border-amber-300/25",
    kpiCycle: ["gold", "sapphire", "teal", "violet"],
    chartStroke: "#d97706",
    chartFill: "#d97706",
  },
};

export const ADMIN_MODULE_TONES: DashTone[] = [
  "gold",
  "sapphire",
  "violet",
  "teal",
  "amber",
  "rose",
  "coral",
  "slate",
  "sapphire",
  "violet",
  "teal",
];

export function toneAt(index: number, cycle: DashTone[]): DashTone {
  return cycle[index % cycle.length]!;
}

export function toneForKpi(role: UserRole, index: number): DashTone {
  return toneAt(index, ROLE_DASHBOARD_THEME[role].kpiCycle);
}
