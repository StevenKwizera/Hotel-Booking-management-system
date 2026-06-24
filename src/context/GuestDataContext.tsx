import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  type BookingApi,
  type NotificationApi,
  type PaymentApi,
  type RecommendationApi,
  type ServiceApi,
} from "@/lib/api";
import type {
  Booking,
  GuestNotification,
  GuestPayment,
  GuestRecommendation,
  GuestServiceRequest,
} from "@/types";

interface GuestDataContextValue {
  isGuest: boolean;
  room: string;
  bookings: Booking[];
  balance: number;
  payments: GuestPayment[];
  serviceRequests: GuestServiceRequest[];
  recommendations: GuestRecommendation[];
  notifications: GuestNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addBooking: (data: {
    checkIn: string;
    checkOut: string;
    roomType: "Standard" | "Deluxe" | "Suite";
    guestCount: number;
    roomNumber?: string;
  }) => Promise<Booking>;
  processPayment: (amount: number, phoneNumber: string) => Promise<void>;
  addServiceRequest: (data: {
    type: GuestServiceRequest["type"];
    room: string;
    description: string;
    priority: GuestServiceRequest["priority"];
  }) => Promise<GuestServiceRequest>;
  advanceServiceStatus: (id: string) => Promise<void>;
  applyRecommendation: (id: string) => Promise<void>;
  saveRecommendation: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const GuestDataContext = createContext<GuestDataContextValue | null>(null);

function mapBooking(b: BookingApi): Booking {
  return {
    id: b.id,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    room: b.room,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    status: b.status as Booking["status"],
    amount: b.amount,
    grossAmount: b.grossAmount ?? b.amount,
    discountRwf: b.discountRwf ?? 0,
    earlyBookingDiscount: b.earlyBookingDiscount ?? false,
    repeatGuestDiscount: b.repeatGuestDiscount ?? false,
    roomType: b.roomType as Booking["roomType"],
    guestCount: b.guestCount,
    checkoutRequested: b.checkoutRequested,
    chargesVerified: b.chargesVerified,
    invoiceIssued: b.invoiceIssued,
    guestArrived: b.guestArrived,
  };
}

function mapPayment(p: PaymentApi): GuestPayment {
  return {
    id: p.id,
    guestName: p.guestName,
    amount: p.amount,
    method: p.method as GuestPayment["method"],
    status: p.status as GuestPayment["status"],
    date: p.date,
    verified: p.verified,
    reference: p.reference,
    bookingCode: p.bookingCode,
    checkIn: p.checkIn,
    checkOut: p.checkOut,
    room: p.room,
    roomType: p.roomType ?? undefined,
    guestCount: p.guestCount ?? undefined,
    bookingTotal: p.bookingTotalRwf ?? undefined,
    confirmationEmail: p.confirmationEmail,
    guestEmail: p.guestEmail,
  };
}

function mapService(s: ServiceApi): GuestServiceRequest {
  return {
    id: s.id,
    type: s.type as GuestServiceRequest["type"],
    room: s.room,
    description: s.description ?? "",
    status: s.status as GuestServiceRequest["status"],
    priority: s.priority as GuestServiceRequest["priority"],
    createdAt: s.createdAt,
    guestEmail: s.guestEmail ?? "",
  };
}

function mapNotification(n: NotificationApi): GuestNotification {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    category: n.category as GuestNotification["category"],
    time: n.time,
    read: n.read,
  };
}

function mapRec(r: RecommendationApi): GuestRecommendation {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    confidence: r.confidence,
    applied: r.applied,
    saved: r.saved,
  };
}

export function GuestDataProvider({ children }: { children: ReactNode }) {
  const { user, apiConnected } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState<GuestPayment[]>([]);
  const [serviceRequests, setServiceRequests] = useState<GuestServiceRequest[]>([]);
  const [recommendations, setRecommendations] = useState<GuestRecommendation[]>([]);
  const [notifications, setNotifications] = useState<GuestNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user.role !== "guest" || !apiConnected) return;
    setLoading(true);
    try {
      // Bookings first — triggers Paypack sync so approved → confirmed updates
      const b = await api.getBookings();
      setBookings(b.map(mapBooking));
      const [p, s, n, bal, rec] = await Promise.all([
        api.getPayments(),
        api.getServices(),
        api.getNotifications(),
        api.getBalance(),
        api.getRecommendations(),
      ]);
      setPayments(p.map(mapPayment));
      setServiceRequests(s.map(mapService));
      setNotifications(n.map(mapNotification));
      setBalance(bal.balanceRwf);
      setRecommendations(rec.map(mapRec));
    } finally {
      setLoading(false);
    }
  }, [user, apiConnected]);

  useEffect(() => {
    if (user?.role === "guest" && apiConnected) refresh();
  }, [user?.id, user?.role, apiConnected, refresh]);

  useEffect(() => {
    if (user?.role !== "guest" || !apiConnected) return;
    const timer = setInterval(() => refresh(), 8000);
    return () => clearInterval(timer);
  }, [user?.role, apiConnected, refresh]);

  const addBooking = useCallback(
    async (data: {
      checkIn: string;
      checkOut: string;
      roomType: "Standard" | "Deluxe" | "Suite";
      guestCount: number;
      roomNumber?: string;
    }) => {
      const created = await api.createBooking({
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        roomType: data.roomType,
        guestCount: data.guestCount,
        roomNumber: data.roomNumber,
      });
      await refresh();
      return mapBooking(created);
    },
    [refresh],
  );

  const processPayment = useCallback(
    async (amount: number, phoneNumber: string) => {
      const result = await api.createPayment(amount, phoneNumber);
      if (result.paymentId) {
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const payment = await api.syncPaypackPayment(result.paymentId);
          if (payment.status === "completed") break;
        }
      }
      await refresh();
    },
    [refresh],
  );

  const addServiceRequest = useCallback(
    async (data: {
      type: GuestServiceRequest["type"];
      room: string;
      description: string;
      priority: GuestServiceRequest["priority"];
    }) => {
      const created = await api.createService({
        type: data.type,
        room: data.room,
        description: data.description,
        priority: data.priority,
      });
      await refresh();
      return mapService(created);
    },
    [refresh],
  );

  const advanceServiceStatus = useCallback(
    async (id: string) => {
      const current = serviceRequests.find((r) => r.id === id);
      if (!current) return;
      const next =
        current.status === "open"
          ? "in-progress"
          : current.status === "in-progress"
            ? "completed"
            : "completed";
      await api.updateServiceStatus(id, next);
      await refresh();
    },
    [serviceRequests, refresh],
  );

  const applyRecommendation = useCallback(
    async (id: string) => {
      await api.applyRecommendation(id);
      await refresh();
    },
    [refresh],
  );

  const saveRecommendation = useCallback(
    async (id: string) => {
      await api.saveRecommendation(id);
      await refresh();
    },
    [refresh],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      await api.markNotificationRead(id);
      await refresh();
    },
    [refresh],
  );

  const dismissNotification = useCallback(
    async (id: string) => {
      await api.dismissNotification(id);
      await refresh();
    },
    [refresh],
  );

  const markAllNotificationsRead = useCallback(async () => {
    await api.markAllNotificationsRead();
    await refresh();
  }, [refresh]);

  const value = useMemo<GuestDataContextValue>(() => {
    const isGuest = user?.role === "guest";
    const noop = async () => {};
    const activeRoom =
      bookings.find((b) => b.status === "checked-in")?.room ??
      bookings.find((b) => b.status === "confirmed")?.room ??
      bookings.find((b) => b.status === "approved")?.room ??
      bookings.find((b) => b.status === "pending")?.room ??
      "—";

    const empty: GuestDataContextValue = {
      isGuest: false,
      room: activeRoom,
      bookings: [],
      balance: 0,
      payments: [],
      serviceRequests: [],
      recommendations: [],
      notifications: [],
      unreadCount: 0,
      loading: false,
      refresh: noop,
      addBooking: async () => {
        throw new Error("Not a guest");
      },
      processPayment: noop,
      addServiceRequest: async () => {
        throw new Error("Not a guest");
      },
      advanceServiceStatus: noop,
      applyRecommendation: noop,
      saveRecommendation: noop,
      markNotificationRead: noop,
      dismissNotification: noop,
      markAllNotificationsRead: noop,
    };
    if (!isGuest) return empty;
    return {
      isGuest: true,
      room: activeRoom,
      bookings,
      balance,
      payments,
      serviceRequests,
      recommendations,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      loading,
      refresh,
      addBooking,
      processPayment,
      addServiceRequest,
      advanceServiceStatus,
      applyRecommendation,
      saveRecommendation,
      markNotificationRead,
      dismissNotification,
      markAllNotificationsRead,
    };
  }, [
    user?.role,
    bookings,
    balance,
    payments,
    serviceRequests,
    recommendations,
    notifications,
    loading,
    refresh,
    addBooking,
    processPayment,
    addServiceRequest,
    advanceServiceStatus,
    applyRecommendation,
    saveRecommendation,
    markNotificationRead,
    dismissNotification,
    markAllNotificationsRead,
  ]);

  return (
    <GuestDataContext.Provider value={value}>{children}</GuestDataContext.Provider>
  );
}

export function useGuestData() {
  const ctx = useContext(GuestDataContext);
  if (!ctx) throw new Error("useGuestData must be used within GuestDataProvider");
  return ctx;
}
