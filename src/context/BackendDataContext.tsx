import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, type BookingApi, type BranchApi, type DashboardApi, type GuestApi, type NotificationApi, type OccupancyApi, type PaymentApi, type RecommendationApi, type ServiceApi, type AuditApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Booking, Guest, GuestNotification, GuestPayment, GuestRecommendation, GuestServiceRequest, KpiMetric, ServiceRequest } from "@/types";

interface BackendDataContextValue {
  loading: boolean;
  refresh: () => Promise<void>;
  bookings: Booking[];
  payments: GuestPayment[];
  services: ServiceRequest[];
  guestServices: GuestServiceRequest[];
  notifications: GuestNotification[];
  recommendations: GuestRecommendation[];
  guests: Guest[];
  balance: number;
  availableRooms: number;
  kpis: KpiMetric[];
  occupancy: OccupancyApi[];
  branches: BranchApi[];
  auditLogs: AuditApi[];
}

const BackendDataContext = createContext<BackendDataContextValue | null>(null);

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
  };
}

function mapService(s: ServiceApi): ServiceRequest {
  return {
    id: s.id,
    type: s.type as ServiceRequest["type"],
    room: s.room,
    status: s.status as ServiceRequest["status"],
    priority: s.priority as ServiceRequest["priority"],
    createdAt: s.createdAt,
    assignedStaff: s.assignedStaff ?? undefined,
    description: s.description,
  };
}

function mapGuestService(s: ServiceApi): GuestServiceRequest {
  return {
    ...mapService(s),
    description: s.description ?? "",
    guestEmail: s.guestEmail ?? "",
    assignedStaff: s.assignedStaff ?? undefined,
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

function mapGuest(g: GuestApi): Guest {
  return {
    id: g.id,
    name: g.name,
    email: g.email,
    phone: g.phone,
    visits: g.visits,
    tier: g.tier as Guest["tier"],
    preferences: g.preferences,
  };
}

export function BackendDataProvider({ children }: { children: ReactNode }) {
  const { user, apiConnected } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<GuestPayment[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [guestServices, setGuestServices] = useState<GuestServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<GuestNotification[]>([]);
  const [recommendations, setRecommendations] = useState<GuestRecommendation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [balance, setBalance] = useState(0);
  const [availableRooms, setAvailableRooms] = useState(14);
  const [kpis, setKpis] = useState<KpiMetric[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyApi[]>([]);
  const [branches, setBranches] = useState<BranchApi[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditApi[]>([]);

  const refresh = useCallback(async () => {
    if (!user || !apiConnected) return;
    setLoading(true);
    try {
      const [b, p, s, n, avail] = await Promise.all([
        api.getBookings(),
        api.getPayments(),
        api.getServices(),
        api.getNotifications(),
        api.getAvailability(),
      ]);
      setBookings(b.map(mapBooking));
      setPayments(p.map(mapPayment));
      setServices(s.map(mapService));
      setGuestServices(s.map(mapGuestService));
      setNotifications(n.map(mapNotification));
      setAvailableRooms(avail.availableRooms);

      if (user.role === "guest") {
        const [bal, rec] = await Promise.all([
          api.getBalance(),
          api.getRecommendations(),
        ]);
        setBalance(bal.balanceRwf);
        setRecommendations(rec.map(mapRec));
      } else {
        const canViewGuests =
          user.role === "admin" ||
          user.role === "management" ||
          user.role === "receptionist";
        const [gList, dash, occ, br, audit] = await Promise.all([
          canViewGuests ? api.getGuests().catch(() => []) : Promise.resolve([]),
          api.getDashboard().catch(() => ({ kpis: [], extras: {} } as DashboardApi)),
          api.getOccupancy().catch(() => []),
          api.getBranches().catch(() => []),
          user.role === "admin" ? api.getAuditLogs().catch(() => []) : Promise.resolve([]),
        ]);
        setGuests(canViewGuests ? gList.map(mapGuest) : []);
        setKpis(
          dash.kpis.map((k) => ({
            id: k.id,
            label: k.label,
            value: k.value,
            change: k.change,
            trend: (k.trend as KpiMetric["trend"]) ?? "neutral",
            icon: k.icon,
          })),
        );
        setOccupancy(occ);
        setBranches(br);
        setAuditLogs(audit);
      }
    } finally {
      setLoading(false);
    }
  }, [user, apiConnected]);

  useEffect(() => {
    if (user && apiConnected) refresh();
    else {
      setBookings([]);
      setPayments([]);
      setServices([]);
      setNotifications([]);
    }
  }, [user, apiConnected, refresh]);

  useEffect(() => {
    if (!user || !apiConnected) return;
    const isFrontDesk =
      user.role === "receptionist" || user.role === "admin" || user.role === "management";
    if (!isFrontDesk) return;
    const timer = setInterval(() => refresh(), 10000);
    return () => clearInterval(timer);
  }, [user, apiConnected, refresh]);

  return (
    <BackendDataContext.Provider
      value={{
        loading,
        refresh,
        bookings,
        payments,
        services,
        guestServices,
        notifications,
        recommendations,
        guests,
        balance,
        availableRooms,
        kpis,
        occupancy,
        branches,
        auditLogs,
      }}
    >
      {children}
    </BackendDataContext.Provider>
  );
}

export function useBackendData() {
  const ctx = useContext(BackendDataContext);
  if (!ctx) throw new Error("useBackendData must be used within BackendDataProvider");
  return ctx;
}
