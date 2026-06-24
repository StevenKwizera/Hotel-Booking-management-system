import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AccentColor, AppSettings, Density, ThemeMode } from "@/types";

const STORAGE_KEY = "orkestra-settings";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  accent: "emerald",
  density: "comfortable",
  sidebarCollapsed: false,
  hotelName: "Net Luna Villa Hotel",
  branchName: "Kigali Main",
};

interface SettingsContextValue extends AppSettings {
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setDensity: (density: Density) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setHotelName: (name: string) => void;
  setBranchName: (name: string) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.setAttribute("data-accent", settings.accent);
    document.documentElement.setAttribute("data-density", settings.density);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setTheme: (theme) => update({ theme }),
      setAccent: (accent) => update({ accent }),
      setDensity: (density) => update({ density }),
      toggleSidebar: () => update({ sidebarCollapsed: !settings.sidebarCollapsed }),
      setSidebarCollapsed: (sidebarCollapsed) => update({ sidebarCollapsed }),
      setHotelName: (hotelName) => update({ hotelName }),
      setBranchName: (branchName) => update({ branchName }),
      resetSettings: () => setSettings(DEFAULT_SETTINGS),
    }),
    [settings, update],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
