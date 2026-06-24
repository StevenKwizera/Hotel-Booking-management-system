import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "@/types";

export type ToastType = "success" | "info" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type ModalType =
  | "new-booking"
  | "new-reservation"
  | "new-guest"
  | "new-request"
  | "record-payment"
  | "guest-service"
  | "notifications"
  | "manage-roles"
  | "guest-profile"
  | "guest-pay"
  | null;

interface AppActionsContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  activeModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  completedTasks: Set<string>;
  completeTask: (taskId: string, role?: UserRole) => void;
  isTaskDone: (taskId: string, role?: UserRole) => boolean;
  navigateTo: (path: string, message?: string) => void;
  exportData: (filename: string, data?: Record<string, unknown>) => void;
}

const AppActionsContext = createContext<AppActionsContextValue | null>(null);

export function AppActionsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const taskKey = (taskId: string, role?: UserRole) =>
    role ? `${role}:${taskId}` : taskId;

  const completeTask = useCallback((taskId: string, role?: UserRole) => {
    setCompletedTasks((prev) => new Set(prev).add(taskKey(taskId, role)));
  }, []);

  const isTaskDone = useCallback(
    (taskId: string, role?: UserRole) => completedTasks.has(taskKey(taskId, role)),
    [completedTasks],
  );

  const navigateTo = useCallback(
    (path: string, message?: string) => {
      navigate(path);
      if (message) showToast(message, "info");
    },
    [navigate, showToast],
  );

  const exportData = useCallback(
    (filename: string, data?: Record<string, unknown>) => {
      const blob = new Blob(
        [
          JSON.stringify(
            { exportedAt: new Date().toISOString(), system: "Orkestra", ...data },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`, "success");
    },
    [showToast],
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      activeModal,
      openModal: setActiveModal,
      closeModal: () => setActiveModal(null),
      completedTasks,
      completeTask,
      isTaskDone,
      navigateTo,
      exportData,
    }),
    [
      toasts,
      showToast,
      dismissToast,
      activeModal,
      completedTasks,
      completeTask,
      isTaskDone,
      navigateTo,
      exportData,
    ],
  );

  return (
    <AppActionsContext.Provider value={value}>{children}</AppActionsContext.Provider>
  );
}

export function useAppActions() {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error("useAppActions must be used within AppActionsProvider");
  return ctx;
}
