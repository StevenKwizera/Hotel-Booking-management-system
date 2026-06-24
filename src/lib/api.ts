const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

const TOKEN_KEY = "orkestra-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as { error?: string }).error ?? res.statusText,
      res.status,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AuthResponse {
  token: string | null;
  user: { id: string; name: string; email: string; role: string } | null;
  requiresOtp?: boolean;
  otpSessionId?: string | null;
  message?: string | null;
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUsers: () => request<UserListItemApi[]>("/users"),

  createStaffUser: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) =>
    request<NonNullable<AuthResponse["user"]>>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: { enabled?: boolean; role?: string }) =>
    request<UserListItemApi>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  resetUserPassword: (id: string, newPassword?: string) =>
    request<{ message: string }>(`/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    }),
  deleteUser: (id: string) =>
    request<{ message: string }>(`/users/${id}`, { method: "DELETE" }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  validateResetToken: (token: string) =>
    request<{ valid: boolean; emailHint: string | null }>(
      `/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
    ),
  resetPasswordWithToken: (token: string, newPassword: string, confirmPassword: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    }),

  me: () => request<NonNullable<AuthResponse["user"]>>("/auth/me"),

  getWorkflowStatus: () => request<WorkflowStatusResponse>("/workflows/status"),
  getTodayArrivals: () => request<BookingApi[]>("/workflows/arrivals/today"),
  getGuestArrivals: () => request<BookingApi[]>("/workflows/arrivals/guest-arrived"),
  recordGuestArrival: (code: string) =>
    request<{ message: string }>(`/workflows/arrival/${code}`, { method: "POST" }),
  getTodayDepartures: () => request<BookingApi[]>("/workflows/departures/today"),
  getCheckoutQueue: () => request<BookingApi[]>("/workflows/checkout-queue"),
  getCheckoutBill: (code: string) => request<CheckoutBillApi>(`/workflows/checkout-bill/${code}`),
  verifyCheckoutCharges: (code: string) =>
    request<CheckoutBillApi>(`/workflows/verify-charges/${code}`, { method: "POST" }),
  issueCheckoutInvoice: (code: string) =>
    request<InvoiceApi>(`/workflows/issue-invoice/${code}`, { method: "POST" }),
  workflowCheckIn: (code: string, roomNumber?: string) =>
    request<BookingApi>(`/workflows/check-in/${code}`, {
      method: "POST",
      body: JSON.stringify(roomNumber ? { roomNumber } : {}),
    }),
  workflowCheckOut: (code: string) =>
    request<BookingApi>(`/workflows/check-out/${code}`, { method: "POST" }),
  guestCheckoutRequest: (code: string) =>
    request<{ message: string }>(`/workflows/checkout-request/${code}`, { method: "POST" }),
  getInvoice: (code: string) => request<InvoiceApi>(`/workflows/invoice/${code}`),

  getRoleDashboard: () => request<RoleDashboardApi>("/analytics/role-dashboard"),

  getBookings: () => request<BookingApi[]>("/bookings"),
  getAvailability: () => request<{ availableRooms: number; totalRooms: number }>("/bookings/availability"),
  searchRooms: (params: {
    checkIn: string;
    checkOut: string;
    roomType?: string;
    availableOnly?: boolean;
  }) => {
    const q = new URLSearchParams({ checkIn: params.checkIn, checkOut: params.checkOut });
    if (params.roomType && params.roomType !== "All") q.set("roomType", params.roomType);
    if (params.availableOnly) q.set("availableOnly", "true");
    return request<RoomSearchApi>(`/bookings/rooms?${q.toString()}`);
  },
  createBooking: (data: CreateBookingApi) =>
    request<BookingApi>("/bookings", { method: "POST", body: JSON.stringify(data) }),
  getBookingQuote: (params: {
    checkIn: string;
    checkOut: string;
    roomType: string;
    roomNumber: string;
    guestCount?: number;
  }) => {
    const q = new URLSearchParams({
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      roomType: params.roomType,
      roomNumber: params.roomNumber,
      guestCount: String(params.guestCount ?? 2),
    });
    return request<BookingQuoteApi>(`/bookings/quote?${q.toString()}`);
  },
  requestBooking: (data: {
    checkIn: string;
    checkOut: string;
    roomType: string;
    guestCount: number;
    roomNumber: string;
  }) =>
    request<BookingApi>("/bookings/request", { method: "POST", body: JSON.stringify(data) }),

  approveBooking: (code: string) =>
    request<BookingApi>(`/bookings/${code}/approve`, { method: "POST" }),

  rejectBooking: (code: string, reason?: string) =>
    request<BookingApi>(`/bookings/${code}/reject`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  payBookingWithPaypack: (code: string, phoneNumber: string, confirmationEmail: string) =>
    request<PaypackPaymentInitApi>(`/bookings/${code}/pay-paypack`, {
      method: "POST",
      body: JSON.stringify({ phoneNumber, confirmationEmail }),
    }),

  syncPaypackPayment: (paymentCode: string) =>
    request<PaymentApi>(`/bookings/payments/${paymentCode}/sync-paypack`, { method: "POST" }),

  bookAndPay: (data: BookWithPaymentApi) =>
    request<BookingConfirmationApi>("/bookings/book-and-pay", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBooking: (code: string, data: { checkIn?: string; checkOut?: string; guestCount?: number }) =>
    request<BookingApi>(`/bookings/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  cancelBooking: (code: string) =>
    request<BookingApi>(`/bookings/${code}/cancel`, { method: "PATCH" }),
  verifyBooking: (code: string) =>
    request<BookingApi>(`/bookings/${code}/verify`, { method: "POST" }),
  checkInBooking: (code: string) =>
    request<BookingApi>(`/bookings/${code}/check-in`, { method: "POST" }),
  checkOutBooking: (code: string) =>
    request<BookingApi>(`/bookings/${code}/check-out`, { method: "POST" }),

  getPayments: () => request<PaymentApi[]>("/payments"),
  getBalance: () => request<{ balanceRwf: number }>("/payments/balance"),
  createPayment: (amount: number, phoneNumber: string) =>
    request<PaypackPaymentInitApi>("/payments", {
      method: "POST",
      body: JSON.stringify({ amount, phoneNumber }),
    }),
  recordStaffPayment: (data: {
    guestEmail: string;
    amount: number;
    method: string;
    reference?: string;
  }) =>
    request<PaymentApi>("/payments/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  processPayment: (code: string) =>
    request<PaymentApi>(`/payments/${code}/process`, { method: "POST" }),
  refundPayment: (code: string) =>
    request<PaymentApi>(`/payments/${code}/refund`, { method: "POST" }),
  verifyPayment: (code: string) =>
    request<PaymentApi>(`/payments/${code}/verify`, { method: "POST" }),
  flagPayment: (code: string) =>
    request<PaymentApi>(`/payments/${code}/flag`, { method: "POST" }),

  getGuests: () => request<GuestApi[]>("/guests"),
  createWalkInGuest: (data: { name: string; email: string; phone?: string }) =>
    request<GuestApi>("/guests/walk-in", { method: "POST", body: JSON.stringify(data) }),
  updateGuestPreferences: (preferences: string[]) =>
    request<{ message: string }>("/guests/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    }),
  getServices: () => request<ServiceApi[]>("/services"),
  createService: (data: CreateServiceApi) =>
    request<ServiceApi>("/services", { method: "POST", body: JSON.stringify(data) }),
  updateServiceStatus: (code: string, status: string) =>
    request<ServiceApi>(`/services/${code}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  assignServiceStaff: (code: string, staffName?: string) =>
    request<ServiceApi>(`/services/${code}/assign`, {
      method: "PATCH",
      body: JSON.stringify(staffName ? { staffName } : {}),
    }),
  getAiInsights: () => request<GuestInsightApi[]>("/guests/ai/insights"),
  getAiStats: () => request<AiStatsApi>("/guests/ai/stats"),
  refreshAi: () =>
    request<{ message: string }>("/guests/ai/refresh", { method: "POST" }),
  getAiOverview: () => request<AiOverviewApi>("/guests/ai/overview"),
  getRecommendations: () => request<RecommendationApi[]>("/guests/recommendations"),
  applyRecommendation: (id: string) =>
    request<RecommendationApi>(`/guests/recommendations/${id}/apply`, { method: "POST" }),
  saveRecommendation: (id: string) =>
    request<RecommendationApi>(`/guests/recommendations/${id}/save`, { method: "POST" }),

  getNotifications: () => request<NotificationApi[]>("/notifications"),
  getUnreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    request("/notifications/read-all", { method: "POST" }),
  dismissNotification: (id: string) =>
    request(`/notifications/${id}`, { method: "DELETE" }),

  getFeedback: () => request<FeedbackApi[]>("/feedback"),
  submitFeedback: (data: SubmitFeedbackApi) =>
    request<FeedbackApi>("/feedback", { method: "POST", body: JSON.stringify(data) }),
  replyToFeedback: (feedbackId: string, message: string) =>
    request<FeedbackApi>(`/feedback/${encodeURIComponent(feedbackId)}/reply`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  getMealMenu: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<MenuItemApi[]>(`/meal-orders/menu${q}`);
  },
  getMealOrders: () => request<MealOrderApi[]>("/meal-orders"),
  createMealOrder: (data: CreateMealOrderApi) =>
    request<MealOrderApi>("/meal-orders", { method: "POST", body: JSON.stringify(data) }),
  approveMealOrder: (orderCode: string) =>
    request<MealOrderApi>(`/meal-orders/${encodeURIComponent(orderCode)}/approve`, { method: "POST" }),
  rejectMealOrder: (orderCode: string, reason: string) =>
    request<MealOrderApi>(`/meal-orders/${encodeURIComponent(orderCode)}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  payMealOrderWithPaypack: (orderCode: string, phoneNumber: string, confirmationEmail: string) =>
    request<PaypackPaymentInitApi>(`/meal-orders/${encodeURIComponent(orderCode)}/pay-paypack`, {
      method: "POST",
      body: JSON.stringify({ phoneNumber, confirmationEmail }),
    }),
  syncMealPaypackPayment: (paymentCode: string) =>
    request<PaymentApi>(`/meal-orders/payments/${encodeURIComponent(paymentCode)}/sync-paypack`, {
      method: "POST",
    }),
  sendMealToKitchen: (orderCode: string) =>
    request<MealOrderApi>(`/meal-orders/${encodeURIComponent(orderCode)}/send-to-kitchen`, { method: "POST" }),
  startMealPreparing: (orderCode: string) =>
    request<MealOrderApi>(`/meal-orders/${encodeURIComponent(orderCode)}/preparing`, { method: "POST" }),
  markMealReady: (orderCode: string) =>
    request<MealOrderApi>(`/meal-orders/${encodeURIComponent(orderCode)}/ready`, { method: "POST" }),
  assignMealServer: (orderCode: string, serverName: string) =>
    request<MealOrderApi>(`/meal-orders/${encodeURIComponent(orderCode)}/assign-server`, {
      method: "POST",
      body: JSON.stringify({ serverName }),
    }),
  markMealServed: (orderCode: string) =>
    request<MealOrderApi>(`/meal-orders/${encodeURIComponent(orderCode)}/served`, { method: "POST" }),

  getMessageRecipients: () => request<MessageRecipientApi[]>("/notifications/recipients"),

  sendNotification: (data: {
    toEmail: string;
    title: string;
    body: string;
    category?: string;
  }) =>
    request<NotificationApi>("/notifications/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDashboard: () => request<DashboardApi>("/analytics/dashboard"),
  getOccupancy: () => request<OccupancyApi[]>("/analytics/occupancy"),
  getBranches: () => request<BranchApi[]>("/analytics/branches"),
  getAuditLogs: () => request<AuditApi[]>("/analytics/audit-logs"),
  getStaffPerformance: () => request<StaffPerformanceApi[]>("/analytics/staff-performance"),
  getFinanceRevenue: () => request<FinanceRevenueApi>("/analytics/finance/revenue"),
  getServiceLogs: () => request<AuditApi[]>("/analytics/service-logs"),
  getReceptionLogs: () => request<AuditApi[]>("/analytics/reception-logs"),

  getSystemSettings: () => request<SystemSettingsApi>("/admin/settings"),
  updateSystemSettings: (data: Partial<SystemSettingsApi>) =>
    request<SystemSettingsApi>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getSecurityLogs: () => request<AuditApi[]>("/admin/security-logs"),
  getBackupHistory: () => request<BackupRecordApi[]>("/admin/backups"),
  runBackup: () =>
    request<BackupResultApi>("/admin/backup", {
      method: "POST",
    }),
  updateBranch: (id: string, data: { status?: string; name?: string }) =>
    request<BranchApi>(`/admin/branches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export interface UserListItemApi {
  id: string;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
  branchName: string;
  createdAt: string;
}

export interface BookingApi {
  id: string;
  guestName: string;
  guestEmail?: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: string;
  amount: number;
  grossAmount?: number;
  discountRwf?: number;
  earlyBookingDiscount?: boolean;
  repeatGuestDiscount?: boolean;
  roomType?: string;
  guestCount?: number;
  checkoutRequested?: boolean;
  chargesVerified?: boolean;
  invoiceIssued?: boolean;
  guestArrived?: boolean;
}

export interface CheckoutBillApi {
  bookingCode: string;
  guestName: string;
  guestEmail?: string;
  room: string;
  roomChargesRwf: number;
  servicesRwf: number;
  totalRwf: number;
  balanceDueRwf: number;
  serviceCount: number;
  checkoutRequested: boolean;
  chargesVerified: boolean;
  invoiceIssued: boolean;
  canCompleteCheckout: boolean;
}

export interface BookingQuoteApi {
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  nightlyRateRwf: number;
  subtotalRwf?: number;
  discountRwf?: number;
  totalRwf: number;
  earlyBookingDiscount?: boolean;
  repeatGuestDiscount?: boolean;
  available: boolean;
}

export interface BookWithPaymentApi {
  checkIn: string;
  checkOut: string;
  roomType: string;
  guestCount: number;
  roomNumber: string;
  paymentMethod: string;
}

export interface BookingConfirmationApi {
  booking: BookingApi;
  payment: PaymentApi | null;
  message: string;
}

export interface PaypackPaymentInitApi {
  paymentId: string;
  paypackRef: string;
  amountRwf: number;
  bookingAmountRwf: number;
  status: string;
  message: string;
  testMode: boolean;
}

export interface CreateBookingApi {
  checkIn: string;
  checkOut: string;
  roomType: string;
  guestCount: number;
  guestName?: string;
  guestEmail?: string;
  roomNumber?: string;
}

export interface RoomListingApi {
  roomNumber: string;
  roomType: string;
  nightlyRateRwf: number;
  availableForDates: boolean;
  status: "AVAILABLE" | "BOOKED" | "OCCUPIED";
  statusLabel: string;
  description: string;
  amenities: string[];
  maxGuests: number;
  bedType: string;
  sizeSqm: number;
  floor: string;
  totalForStayRwf: number;
}

export interface RoomSearchApi {
  rooms: RoomListingApi[];
  availableCount: number;
  totalCount: number;
  checkIn: string;
  checkOut: string;
}

export interface PaymentApi {
  id: string;
  guestName: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  verified?: boolean;
  reference?: string | null;
  bookingCode?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  room?: string | null;
  roomType?: string | null;
  guestCount?: number | null;
  bookingTotalRwf?: number | null;
  confirmationEmail?: string | null;
  guestEmail?: string | null;
}

export interface FinanceRevenueApi {
  todayRevenueRwf: number;
  weekRevenueRwf: number;
  monthRevenueRwf: number;
  pendingCount: number;
  flaggedCount: number;
  verifiedCount: number;
  byMethod: { method: string; amountRwf: number; count: number }[];
}

export interface ServiceApi {
  id: string;
  type: string;
  room: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  guestEmail?: string;
  assignedStaff?: string | null;
}

export interface RoleDashboardApi {
  role: string;
  greeting: string;
  subtitle: string;
  kpis: { id: string; label: string; value: string; icon: string }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    icon: string;
    actionLabel: string;
    path: string;
    priority: string;
  }[];
}

export interface InvoiceApi {
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  room: string;
  roomChargesRwf: number;
  servicesRwf: number;
  totalRwf: number;
  balanceRwf: number;
  issuedAt: string;
}

export interface CreateServiceApi {
  type: string;
  room: string;
  description: string;
  priority: string;
}

export interface GuestApi {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  tier: string;
  preferences: string[];
  balance: number;
}

export interface RecommendationApi {
  id: string;
  title: string;
  description: string;
  confidence: number;
  applied: boolean;
  saved: boolean;
}

export interface GuestInsightApi {
  id: string;
  guest: string;
  suggestion: string;
  confidence: number;
  title: string;
}

export interface AiStatsApi {
  activeModels: number;
  predictionsToday: number;
  avgConfidence: number;
}

export interface AiOverviewApi {
  pipeline: {
    id: string;
    title: string;
    summary: string;
    signals: { label: string; value: string }[];
    status: string;
  }[];
  guestAnalysis: {
    guestName: string;
    returningGuest: boolean;
    visitCount: number;
    preferredRoomType: string;
    guestSegment: string;
    patterns: { pattern: string; detail: string }[];
    predictions: { title: string; detail: string; confidence: number }[];
  } | null;
  managementInsights: {
    occupancyForecast: { day: string; predictedOccupancyPct: number; trend: string }[];
    dynamicPricing: {
      roomType: string;
      baseRateRwf: number;
      suggestedRateRwf: number;
      reason: string;
    }[];
    serviceOptimization: {
      serviceType: string;
      peakPeriod: string;
      requestCount: number;
      recommendation: string;
    }[];
    strategicInsights: string[];
  } | null;
}

export interface NotificationApi {
  id: string;
  title: string;
  body: string;
  category: string;
  time: string;
  read: boolean;
}

export interface MessageRecipientApi {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface FeedbackApi {
  id: string;
  guestName: string;
  guestEmail: string;
  room: string | null;
  rating: number;
  category: string;
  subject: string | null;
  message: string;
  createdAt: string;
  staffReply: string | null;
  repliedByName: string | null;
  repliedAt: string | null;
}

export interface SubmitFeedbackApi {
  rating: number;
  category: string;
  subject?: string;
  room?: string;
  message: string;
}

export interface MenuItemApi {
  id: string;
  name: string;
  category: "breakfast" | "lunch" | "dinner";
  priceRwf: number;
  description: string;
}

export interface MealOrderLineApi {
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPriceRwf: number;
  lineTotalRwf: number;
}

export interface MealOrderApi {
  id: string;
  guestName: string;
  guestEmail: string;
  room: string;
  mealCategory: "breakfast" | "lunch" | "dinner";
  status: string;
  totalRwf: number;
  guestNotes: string | null;
  rejectionReason: string | null;
  serverName: string | null;
  paymentCode: string | null;
  items: MealOrderLineApi[];
  createdAt: string;
}

export interface CreateMealOrderApi {
  mealCategory: string;
  room: string;
  guestNotes?: string;
  items: { menuItemId: string; quantity: number }[];
}

export interface BranchApi {
  id: string;
  name: string;
  rooms: number;
  occupancy: number;
  status: string;
}

export interface AuditApi {
  user: string;
  action: string;
  time: string;
}

export interface SystemSettingsApi {
  hotelName: string;
  branchDisplayName: string;
  otpAdmin: boolean;
  otpManagement: boolean;
  otpFinance: boolean;
  sessionTimeoutMinutes: number;
  auditLoggingEnabled: boolean;
}

export interface BackupRecordApi {
  id: string;
  createdAt: string;
  createdBy: string;
  label: string;
  sizeBytes: number;
  userCount: number;
  bookingCount: number;
  paymentCount: number;
  auditCount: number;
}

export interface BackupResultApi {
  record: BackupRecordApi;
  exportPayload: Record<string, unknown>;
}

export interface StaffPerformanceApi {
  staffName: string;
  assigned: number;
  completed: number;
  inProgress: number;
  open: number;
  completionRatePct: number;
}

export interface DashboardApi {
  kpis: { id: string; label: string; value: string; change?: number; trend?: string; icon: string }[];
  extras: Record<string, unknown>;
}

export interface OccupancyApi {
  day: string;
  occupancy: number;
  revenue: number;
}

export interface WorkflowStatusResponse {
  system: string;
  partner: string;
  modules: number;
  stakeholders: string[];
  workflows: Record<
    string,
    { steps: string[]; status: string }
  >;
}

export async function isApiAvailable(): Promise<boolean> {
  try {
    await api.health();
    return true;
  } catch {
    return false;
  }
}
