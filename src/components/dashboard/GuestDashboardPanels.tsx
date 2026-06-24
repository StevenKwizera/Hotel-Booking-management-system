import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GuestStayHub } from "@/components/stay/GuestStayHub";
import { useGuestData } from "@/context/GuestDataContext";
import type { Booking } from "@/types";
import {
  computeStayStepState,
  type StayProgressInput,
} from "@/lib/guest-stay-journey";

function pickActiveBooking(bookings: Booking[]): Booking | undefined {
  return (
    bookings.find((b) => b.status === "checked-in") ??
    bookings.find((b) => b.status === "confirmed") ??
    bookings.find((b) => b.status === "approved") ??
    bookings.find((b) => b.status === "pending") ??
    bookings[0]
  );
}

function statusLabel(status: Booking["status"] | undefined): string {
  switch (status) {
    case "checked-in":
      return "Checked in";
    case "confirmed":
      return "Confirmed";
    case "approved":
      return "Approved — pay now";
    case "pending":
      return "Pending";
    case "checked-out":
      return "Checked out";
    case "cancelled":
      return "Cancelled";
    default:
      return "No active stay";
  }
}

export function GuestDashboardPanels() {
  const guest = useGuestData();
  const navigate = useNavigate();

  const active = useMemo(() => pickActiveBooking(guest.bookings), [guest.bookings]);

  const stayProgress = useMemo<StayProgressInput>(
    () => ({
      role: "guest",
      bookingStatus: active?.status,
      guestArrived: active?.guestArrived,
      chargesVerified: active?.chargesVerified,
      room: guest.room !== "—" ? guest.room : active?.room,
      serviceCount: guest.serviceRequests.length,
      completedServiceCount: guest.serviceRequests.filter((s) => s.status === "completed")
        .length,
      recommendationCount: guest.recommendations.length,
    }),
    [active, guest.room, guest.serviceRequests, guest.recommendations.length],
  );

  const openServices = guest.serviceRequests.filter((s) => s.status !== "completed").length;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <CardHeader
          title="Your stay"
          subtitle={
            active
              ? `${active.id} · ${active.roomType} · ${active.guestCount} guest(s)`
              : "No reservation linked — book a room to get started"
          }
        />
        {active ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[var(--text-muted)]">Status</dt>
              <dd className="mt-0.5 font-medium">
                <Badge variant={active.status === "checked-in" ? "success" : "info"}>
                  {statusLabel(active.status)}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Room</dt>
              <dd className="mt-0.5 font-medium">{guest.room}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Check-in → Check-out</dt>
              <dd className="mt-0.5 font-medium">
                {active.checkIn} → {active.checkOut}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Stay total / Balance</dt>
              <dd className="mt-0.5 font-medium">
                RWF {active.amount.toLocaleString()}
                {guest.balance > 0 && (
                  <span className="ml-1 text-[var(--danger)]">
                    · RWF {guest.balance.toLocaleString()} due
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Open service requests</dt>
              <dd className="mt-0.5 font-medium">{openServices}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">AI recommendations</dt>
              <dd className="mt-0.5 font-medium">{guest.recommendations.length} available</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Unread alerts</dt>
              <dd className="mt-0.5 font-medium">{guest.unreadCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Payments on file</dt>
              <dd className="mt-0.5 font-medium">{guest.payments.length}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Browse availability and confirm your dates to see room assignment and check-in steps
            here.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate("/reservations")}>
            Reservations
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/payments")}>
            Payments
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/services")}>
            Services
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/check-in-out")}>
            Check-in / out
          </Button>
        </div>
      </Card>

      <GuestStayHub compact progress={stayProgress} />
    </div>
  );
}
