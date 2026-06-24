import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useGuestData } from "@/context/GuestDataContext";
import { useSettings } from "@/context/SettingsContext";
import { downloadPaymentReceipt, printPaymentReceipt, receiptFromBookingPayment } from "@/lib/payment-receipt";
import type { Booking } from "@/types";

function latestRejectionMessage(
  bookingId: string,
  notifications: { title: string; body: string; read: boolean }[],
): string | null {
  const match = notifications.find(
    (n) =>
      n.title.toLowerCase().includes("not approved") &&
      (n.body.includes(bookingId) || n.body.toLowerCase().includes("booking")),
  );
  return match?.body ?? null;
}

export function GuestBookingStatusBanner() {
  const guest = useGuestData();
  const { hotelName, branchName } = useSettings();

  const pending = useMemo(
    () => guest.bookings.filter((b) => b.status === "pending"),
    [guest.bookings],
  );
  const approved = useMemo(
    () => guest.bookings.filter((b) => b.status === "approved"),
    [guest.bookings],
  );
  const confirmed = useMemo(
    () => guest.bookings.filter((b) => b.status === "confirmed").slice(0, 2),
    [guest.bookings],
  );
  const recentlyRejected = useMemo(() => {
    return guest.bookings
      .filter((b) => b.status === "cancelled")
      .slice(0, 3)
      .map((b) => ({
        booking: b,
        reason: latestRejectionMessage(b.id, guest.notifications),
      }))
      .filter((x) => x.reason);
  }, [guest.bookings, guest.notifications]);

  if (pending.length === 0 && approved.length === 0 && confirmed.length === 0 && recentlyRejected.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {confirmed.map((b) => {
        const payment = guest.payments.find(
          (p) => p.status === "completed" && p.bookingCode === b.id,
        );
        return (
          <StatusCard
            key={b.id}
            booking={b}
            tone="confirmed"
            title="Payment confirmed — reservation secured"
            message="Your Paypack payment was received. Check your email for confirmation, or print/download your receipt below."
            action={
              payment ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      printPaymentReceipt(
                        receiptFromBookingPayment(b, payment, hotelName, branchName),
                      )
                    }
                  >
                    Print receipt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadPaymentReceipt(
                        receiptFromBookingPayment(b, payment, hotelName, branchName),
                      )
                    }
                  >
                    Download
                  </Button>
                </div>
              ) : (
                <Link to="/reservations">
                  <Button size="sm" variant="outline">
                    View booking
                  </Button>
                </Link>
              )
            }
          />
        );
      })}

      {pending.map((b) => (
        <StatusCard
          key={b.id}
          booking={b}
          tone="pending"
          title="Booking submitted — waiting for approval"
          message="Reception will review your request. You will be notified here when it is approved or rejected."
        />
      ))}

      {approved.map((b) => (
        <StatusCard
          key={b.id}
          booking={b}
          tone="approved"
          title="Booking approved!"
          message="Your stay is approved. Pay now with Paypack MoMo to confirm your reservation."
          action={
            <Link to="/reservations#pay-booking">
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Pay Rwf {b.amount.toLocaleString()}
              </button>
            </Link>
          }
        />
      ))}

      {recentlyRejected.map(({ booking, reason }) => (
        <StatusCard
          key={booking.id}
          booking={booking}
          tone="rejected"
          title="Booking not approved"
          message={reason ?? "Your booking request was declined. Contact reception for help."}
        />
      ))}
    </div>
  );
}

function StatusCard({
  booking,
  tone,
  title,
  message,
  action,
}: {
  booking: Booking;
  tone: "pending" | "approved" | "rejected" | "confirmed";
  title: string;
  message: string;
  action?: ReactNode;
}) {
  const border =
    tone === "confirmed"
      ? "border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-500/35"
      : tone === "approved"
      ? "border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-500/30"
      : tone === "rejected"
        ? "border-red-200/60 bg-red-50/30 dark:border-red-500/30"
        : "border-amber-200/60 bg-amber-50/30 dark:border-amber-500/30";

  const badge =
    tone === "confirmed" ? (
      <Badge variant="success">Paid & confirmed</Badge>
    ) : tone === "approved" ? (
      <Badge variant="success">Approved</Badge>
    ) : tone === "rejected" ? (
      <Badge variant="danger">Rejected</Badge>
    ) : (
      <Badge variant="warning">Pending</Badge>
    );

  return (
    <Card className={border}>
      <CardHeader title={title} subtitle={`${booking.id} · ${booking.room}`} action={badge} />
      <p className="text-sm text-[var(--text-secondary)]">{message}</p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {booking.checkIn} → {booking.checkOut} · RWF {booking.amount.toLocaleString()}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
