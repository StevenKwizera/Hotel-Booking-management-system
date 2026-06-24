import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { useGuestData } from "@/context/GuestDataContext";
import { api } from "@/lib/api";

export function GuestArrivalPanel() {
  const { showToast } = useAppActions();
  const guest = useGuestData();

  const today = new Date().toISOString().slice(0, 10);
  const activeBooking =
    guest.bookings.find((b) => b.status === "checked-in") ??
    guest.bookings.find(
      (b) =>
        (b.status === "confirmed" || b.status === "pending") &&
        b.checkIn <= today &&
        b.checkOut >= today,
    );

  const handleArrival = async () => {
    if (!activeBooking) return;
    try {
      const res = await api.recordGuestArrival(activeBooking.id);
      showToast(res.message, "success");
      await guest.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not notify reception", "error");
    }
  };

  if (!activeBooking) {
    return (
      <section id="arrival">
        <Card>
          <CardHeader title="Hotel arrival" subtitle="No active reservation for today" />
          <p className="text-sm text-[var(--text-muted)]">
            Book a room or wait until your check-in date to notify the front desk.
          </p>
        </Card>
      </section>
    );
  }

  if (activeBooking.status === "checked-in") {
    return (
      <section id="arrival">
        <Card className="border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-500/25 dark:bg-emerald-950/20">
          <CardHeader
            title="You are checked in"
            subtitle={`${activeBooking.room} · ${activeBooking.id}`}
            action={<Badge variant="success">Checked in</Badge>}
          />
          <p className="text-sm text-[var(--text-secondary)]">
            Welcome to Net Luna Villa. Explore services, AI recommendations, and room requests below.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section id="arrival">
      <Card>
        <CardHeader
          title="You've arrived at the hotel"
          subtitle={`${activeBooking.room} · ${activeBooking.id} · check-in ${activeBooking.checkIn}`}
          action={
            activeBooking.guestArrived ? (
              <Badge variant="success">Reception notified</Badge>
            ) : (
              <Badge variant="warning">Awaiting notification</Badge>
            )
          }
        />
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Tap below to alert reception. They will verify your booking, assign your room, and complete
          check-in.
        </p>
        {!activeBooking.guestArrived && (
          <Button icon={<Icon name="MapPin" className="h-4 w-4" />} onClick={handleArrival}>
            Notify front desk — I've arrived
          </Button>
        )}
      </Card>
    </section>
  );
}
