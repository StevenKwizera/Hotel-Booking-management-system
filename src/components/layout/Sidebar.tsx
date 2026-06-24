import { NavLink, useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { NAV_ITEMS } from "@/lib/navigation";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const { sidebarCollapsed, hotelName, branchName } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "guest";
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <aside
      className={`flex h-full flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] transition-all duration-300 ${
        sidebarCollapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className={`border-b border-white/10 ${sidebarCollapsed ? "px-3 py-5" : "px-5 py-6"}`}>
        <NavLink to="/dashboard" className="flex items-center gap-3" title="Dashboard">
          <Logo size={sidebarCollapsed ? 44 : 48} variant="sidebar" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold leading-tight tracking-wide">
                Orkestra
              </p>
              <p className="truncate text-xs text-[var(--sidebar-muted)]">{hotelName}</p>
              <p className="truncate text-[10px] text-[var(--sidebar-muted)]/80">{branchName}</p>
            </div>
          )}
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                end={item.path === "/dashboard"}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-[var(--spacing-nav,0.625rem)] text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--sidebar-active)] font-medium text-[var(--accent)] shadow-sm"
                      : "text-[var(--sidebar-muted)] hover:bg-white/5 hover:text-[var(--sidebar-text)]"
                  } ${sidebarCollapsed ? "justify-center px-2" : ""}`
                }
              >
                <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!sidebarCollapsed && (
        <div className="space-y-3 border-t border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--sidebar-muted)]">
              Partner
            </p>
            <p className="mt-1 text-xs">Net Luna Villa · AUCA</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)]"
            onClick={handleLogout}
            icon={<Icon name="LogOut" className="h-4 w-4" />}
          >
            Logout
          </Button>
        </div>
      )}
    </aside>
  );
}
