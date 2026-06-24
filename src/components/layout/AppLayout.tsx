import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NAV_ITEMS } from "@/lib/navigation";
import { useSettings } from "@/context/SettingsContext";

const MAIN_PADDING: Record<string, string> = {
  compact: "p-4",
  comfortable: "p-6",
  spacious: "p-8",
};

export function AppLayout() {
  const { density } = useSettings();
  const location = useLocation();
  const current = NAV_ITEMS.find(
    (item) =>
      item.path === location.pathname ||
      (item.path !== "/dashboard" && location.pathname.startsWith(item.path)),
  );

  const title = current?.label ?? "Dashboard";
  const subtitle = current?.description ?? "Operational overview for Net Luna Villa Hotel";

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className={`flex-1 overflow-y-auto ${MAIN_PADDING[density] ?? "p-6"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
