import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { PaymentMethodPicker } from "@/components/payments/PaymentMethodPicker";
import { PaypackPhoneField } from "@/components/payments/PaypackPhoneField";
import { useAppActions, type ModalType } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { useGuestData } from "@/context/GuestDataContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api, ApiError } from "@/lib/api";
import { MAX_ROOM_GUESTS, validateGuestCount } from "@/lib/booking-validation";
import { isMtnRwandaPhone, normalizeMtnPhoneInput } from "@/lib/payment-providers";
import type { GuestServiceRequest } from "@/types";

const categoryIcon: Record<string, string> = {
  booking: "CalendarCheck",
  payment: "CreditCard",
  service: "ConciergeBell",
  recommendation: "Sparkles",
  checkout: "LogOut",
};

const ROLE_MATRIX = [
  { name: "Administrator", permissions: "Full system access" },
  { name: "Management", permissions: "Analytics, reports, guests, staff creation" },
  { name: "Receptionist", permissions: "Bookings, check-in/out" },
  { name: "Finance", permissions: "Payments, reports" },
  { name: "Staff", permissions: "Services, communications" },
  { name: "Guest", permissions: "Self-service portal" },
];

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30";

export function AppModals() {
  const { activeModal, closeModal, showToast } = useAppActions();
  const { user } = useAuth();
  const guest = useGuestData();
  const backend = useBackendData();
  const [loading, setLoading] = useState(false);

  const [payAmount, setPayAmount] = useState("");
  const [payPhone, setPayPhone] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState("Deluxe");
  const [guestCount, setGuestCount] = useState("2");

  const [walkInPhone, setWalkInPhone] = useState("");
  const [serviceType, setServiceType] = useState<GuestServiceRequest["type"]>("housekeeping");
  const [serviceRoom, setServiceRoom] = useState("301");
  const [serviceDesc, setServiceDesc] = useState("");
  const [servicePriority, setServicePriority] = useState<GuestServiceRequest["priority"]>("medium");

  const [paymentGuestEmail, setPaymentGuestEmail] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const [preferencesText, setPreferencesText] = useState("");

  useEffect(() => {
    if (activeModal) setLoading(false);
  }, [activeModal]);

  if (!activeModal) return null;

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Action failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPay = () =>
    run(async () => {
      const parsed = payAmount ? Number(payAmount) : guest.balance;
      if (!Number.isFinite(parsed) || parsed <= 0) {
        showToast("Enter a valid amount", "warning");
        return;
      }
      if (!payPhone.trim()) {
        showToast("Enter your MTN MoMo number", "warning");
        return;
      }
      if (!isMtnRwandaPhone(payPhone)) {
        showToast("Use a valid MTN number (078… or 079…)", "warning");
        return;
      }
      await guest.processPayment(parsed, normalizeMtnPhoneInput(payPhone));
      closeModal();
      showToast(`Paypack payment RWF ${parsed.toLocaleString()} initiated`, "success");
    });

  const handleBooking = () =>
    run(async () => {
      if (!checkIn || !checkOut || !guestName.trim()) {
        showToast("Fill guest name and dates", "warning");
        return;
      }
      const guestsError = validateGuestCount(Number(guestCount) || 1);
      if (guestsError) {
        showToast(guestsError, "warning");
        return;
      }
      const booking = await api.createBooking({
        checkIn,
        checkOut,
        roomType,
        guestCount: Number(guestCount) || 1,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || undefined,
      });
      await backend.refresh();
      closeModal();
      showToast(`Booking ${booking.id} created`, "success");
    });

  const handleWalkInGuest = () =>
    run(async () => {
      if (!guestName.trim() || !guestEmail.trim()) {
        showToast("Name and email required", "warning");
        return;
      }
      await api.createWalkInGuest({
        name: guestName.trim(),
        email: guestEmail.trim(),
        phone: walkInPhone.trim(),
      });
      await backend.refresh();
      closeModal();
      showToast(`Guest ${guestEmail} registered (password: password123)`, "success");
    });

  const handleServiceRequest = () =>
    run(async () => {
      if (!serviceDesc.trim()) {
        showToast("Add a description", "warning");
        return;
      }
      await api.createService({
        type: serviceType,
        room: serviceRoom,
        description: serviceDesc.trim(),
        priority: servicePriority,
      });
      await backend.refresh();
      closeModal();
      showToast("Service request submitted", "success");
    });

  const handleRecordPayment = () =>
    run(async () => {
      const amount = Number(paymentAmount);
      if (!paymentGuestEmail.trim() || !Number.isFinite(amount) || amount <= 0) {
        showToast("Guest email and valid amount required", "warning");
        return;
      }
      await api.recordStaffPayment({
        guestEmail: paymentGuestEmail.trim(),
        amount,
        method: "Paypack",
        reference: paymentRef.trim() || undefined,
      });
      await backend.refresh();
      closeModal();
      showToast(`Payment RWF ${amount.toLocaleString()} recorded`, "success");
    });

  const handlePreferences = () =>
    run(async () => {
      const prefs = preferencesText
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      await api.updateGuestPreferences(prefs);
      await guest.refresh();
      closeModal();
      showToast("Preferences saved", "success");
    });

  const handleNotificationsConfirm = () =>
    run(async () => {
      if (user?.role === "guest") {
        await guest.markAllNotificationsRead();
      } else {
        await api.markAllNotificationsRead();
        await backend.refresh();
      }
      closeModal();
      showToast("All notifications marked as read", "success");
    });

  const titles: Record<NonNullable<ModalType>, { title: string; subtitle: string }> = {
    "new-booking": { title: "New booking", subtitle: "Create a reservation for a guest" },
    "new-reservation": { title: "New reservation", subtitle: "Reservation & booking module" },
    "new-guest": { title: "Register walk-in guest", subtitle: "Creates guest account (password123)" },
    "new-request": { title: "New service request", subtitle: "Operations queue" },
    "record-payment": { title: "Record payment", subtitle: "Front desk / finance collection" },
    "guest-service": { title: "Request room service", subtitle: `Room ${guest.room}` },
    notifications: {
      title: user?.role === "guest" ? "Your alerts" : "Notifications",
      subtitle: user?.role === "guest" ? "Bookings, payments & stay updates" : "System alerts",
    },
    "manage-roles": { title: "Role permissions", subtitle: "Security & access control" },
    "guest-profile": { title: "Stay preferences", subtitle: "Comma-separated (e.g. vegetarian, quiet room)" },
    "guest-pay": { title: "Pay your balance", subtitle: "Mobile money, banks & cards" },
  };

  const meta = titles[activeModal];

  const confirmHandlers: Partial<Record<NonNullable<ModalType>, () => void>> = {
    "guest-pay": handleGuestPay,
    "new-booking": handleBooking,
    "new-reservation": handleBooking,
    "new-guest": handleWalkInGuest,
    "new-request": handleServiceRequest,
    "record-payment": handleRecordPayment,
    "guest-profile": handlePreferences,
    notifications: handleNotificationsConfirm,
    "manage-roles": () => closeModal(),
  };

  const confirmLabels: Partial<Record<NonNullable<ModalType>, string>> = {
    notifications: "Mark all read",
    "manage-roles": "Close",
    "guest-pay": "Process payment",
    "new-booking": "Create booking",
    "new-reservation": "Confirm reservation",
    "new-guest": "Register guest",
    "new-request": "Submit request",
    "record-payment": "Record payment",
    "guest-profile": "Save preferences",
  };

  const bookingForm = (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="text-sm text-[var(--text-secondary)]">Guest name</span>
        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className={inputClass} />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm text-[var(--text-secondary)]">Guest email (staff bookings)</span>
        <input
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder="guest@orkestra.com"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--text-secondary)]">Check-in</span>
        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--text-secondary)]">Check-out</span>
        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--text-secondary)]">Room type</span>
        <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className={inputClass}>
          <option value="Standard">Standard</option>
          <option value="Deluxe">Deluxe</option>
          <option value="Suite">Suite</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm text-[var(--text-secondary)]">Guests</span>
        <input type="number" min={1} max={MAX_ROOM_GUESTS} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} className={inputClass} />
      </label>
    </div>
  );

  let body: React.ReactNode;

  if (activeModal === "notifications" && user?.role === "guest") {
    body = (
      <ul className="max-h-80 space-y-3 overflow-y-auto text-sm">
        {guest.notifications.length === 0 ? (
          <li className="text-[var(--text-muted)]">No notifications.</li>
        ) : (
          guest.notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border px-3 py-2.5 ${n.read ? "border-[var(--border-subtle)]" : "border-[var(--accent)]/30 bg-[var(--accent)]/5"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2">
                  <Icon name={categoryIcon[n.category] ?? "Bell"} className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-[var(--text-secondary)]">{n.body}</p>
                    <p className="text-xs text-[var(--text-muted)]">{n.time}</p>
                  </div>
                </div>
                {!n.read && <Badge variant="info">New</Badge>}
              </div>
            </li>
          ))
        )}
      </ul>
    );
  } else if (activeModal === "notifications") {
    body = (
      <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
        {backend.notifications.length === 0 ? (
          <li className="text-[var(--text-muted)]">No notifications.</li>
        ) : (
          backend.notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border px-3 py-2.5 ${n.read ? "border-[var(--border-subtle)]" : "border-[var(--accent)]/30 bg-[var(--accent)]/5"}`}
            >
              <p className="font-medium">{n.title}</p>
              <p className="text-[var(--text-secondary)]">{n.body}</p>
              <p className="text-xs text-[var(--text-muted)]">{n.time}</p>
            </li>
          ))
        )}
      </ul>
    );
  } else if (activeModal === "manage-roles") {
    body = (
      <div className="space-y-4">
        <ul className="space-y-2 text-sm">
          {ROLE_MATRIX.map((r) => (
            <li key={r.name} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2.5">
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{r.permissions}</p>
            </li>
          ))}
        </ul>
        {user?.role === "admin" && (
          <Link to="/user-management" onClick={closeModal}>
            <Button className="w-full" variant="outline">
              Open user management
            </Button>
          </Link>
        )}
      </div>
    );
  } else if (activeModal === "guest-pay") {
    body = (
      <div className="grid gap-4">
        <p className="text-sm text-[var(--text-muted)]">
          Balance: <span className="font-semibold text-[var(--text-primary)]">RWF {guest.balance.toLocaleString()}</span>
        </p>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Amount (RWF)</span>
          <input type="number" value={payAmount || String(guest.balance)} onChange={(e) => setPayAmount(e.target.value)} className={inputClass} />
        </label>
        <PaypackPhoneField value={payPhone} onChange={setPayPhone} />
        <PaymentMethodPicker />
      </div>
    );
  } else if (activeModal === "new-booking" || activeModal === "new-reservation") {
    body = bookingForm;
  } else if (activeModal === "new-guest") {
    body = (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--text-secondary)]">Full name</span>
          <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Email</span>
          <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Phone</span>
          <input value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} className={inputClass} />
        </label>
        <p className="sm:col-span-2 text-xs text-[var(--text-muted)]">Default password: password123</p>
      </div>
    );
  } else if (activeModal === "new-request") {
    body = (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Type</span>
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value as GuestServiceRequest["type"])} className={inputClass}>
            <option value="housekeeping">Housekeeping</option>
            <option value="room-service">Room service</option>
            <option value="maintenance">Maintenance</option>
            <option value="concierge">Concierge</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Room</span>
          <input value={serviceRoom} onChange={(e) => setServiceRoom(e.target.value)} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-[var(--text-secondary)]">Description</span>
          <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} rows={3} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Priority</span>
          <select value={servicePriority} onChange={(e) => setServicePriority(e.target.value as GuestServiceRequest["priority"])} className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
    );
  } else if (activeModal === "record-payment") {
    body = (
      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Guest email</span>
          <input type="email" value={paymentGuestEmail} onChange={(e) => setPaymentGuestEmail(e.target.value)} placeholder="guest@orkestra.com" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Amount (RWF)</span>
          <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Paypack reference (optional)</span>
          <input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="PAYPACK-..." className={inputClass} />
        </label>
        <PaymentMethodPicker />
      </div>
    );
  } else if (activeModal === "guest-profile") {
    body = (
      <label className="block">
        <span className="text-sm text-[var(--text-secondary)]">Preferences (comma-separated)</span>
        <textarea
          value={preferencesText}
          onChange={(e) => setPreferencesText(e.target.value)}
          rows={4}
          placeholder="vegetarian, late checkout, quiet room"
          className={inputClass}
        />
      </label>
    );
  } else {
    body = null;
  }

  return (
    <Modal
      open
      onClose={closeModal}
      title={meta.title}
      subtitle={meta.subtitle}
      footer={
        <ModalFooter
          onCancel={closeModal}
          onConfirm={() => (confirmHandlers[activeModal] ?? closeModal)()}
          confirmLabel={confirmLabels[activeModal] ?? "Confirm"}
          loading={loading}
        />
      }
    >
      {body}
    </Modal>
  );
}
