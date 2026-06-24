import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { useAppActions } from "@/context/AppActionsContext";
import { useBackendData } from "@/context/BackendDataContext";
import { useGuestData } from "@/context/GuestDataContext";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { ROLE_LABELS } from "@/lib/navigation";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { toggleSidebar, hotelName } = useSettings();
  const { user, logout } = useAuth();
  const { openModal, showToast, navigateTo } = useAppActions();
  const backend = useBackendData();
  const guest = useGuestData();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isGuestUser = user?.role === "guest";
  const notifications = isGuestUser ? guest.notifications : backend.notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    if (isGuestUser) {
      navigateTo("/reservations", `Showing bookings matching "${q}"`);
    } else if (user?.role === "receptionist" || user?.role === "admin" || user?.role === "management") {
      navigateTo("/guests", `Search guests: "${q}"`);
    } else if (user?.role === "finance") {
      navigateTo("/payments", `Search payments: "${q}"`);
    } else {
      navigateTo("/dashboard", `Search: "${q}"`);
    }
    showToast(`Searching for "${q}"`, "info");
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="cursor-pointer rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
            aria-label="Toggle sidebar"
          >
            <Icon name="PanelLeft" className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
              {title}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {subtitle ?? hotelName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 sm:flex">
            <Icon name="Search" className="h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guests, bookings..."
              className="w-48 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </div>

          {user && (
            <div className="hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm sm:block">
              <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{ROLE_LABELS[user.role]}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => openModal("notifications")}
            className="relative cursor-pointer rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
            aria-label="Notifications"
          >
            <Icon name="Bell" className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            icon={<Icon name="Palette" className="h-4 w-4" />}
          >
            Customize
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            icon={<Icon name="LogOut" className="h-4 w-4" />}
          >
            Logout
          </Button>
        </div>
      </header>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
