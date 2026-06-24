import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppActions } from "@/context/AppActionsContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api, ApiError } from "@/lib/api";
import type { Booking } from "@/types";

export function BookingVerifyPanel() {
  const { showToast } = useAppActions();
  const { bookings, refresh } = useBackendData();
  const [busy, setBusy] = useState<string | null>(null);

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  const handleVerify = async (booking: Booking) => {
    setBusy(booking.id);
    try {
      await api.verifyBooking(booking.id);
      showToast(`Verified: ${booking.guestName} — ${booking.id}`, "success");
      await refresh();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Verification failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="verify">
      <Card>
        <CardHeader
          title="Verify reservations"
          subtitle="Confirm guest details and payment before arrival"
          action={
            pending.length > 0 ? (
              <Badge variant="warning">{pending.length} pending</Badge>
            ) : (
              <Badge variant="success">All verified</Badge>
            )
          }
        />
        {pending.length === 0 && confirmed.length === 0 ? (
          <EmptyState
            icon="ShieldCheck"
            title="No bookings to verify"
            description="New reservations appear here until verified."
          />
        ) : (
          <ul className="space-y-2">
            {pending.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200/50 bg-amber-50/40 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-950/20"
              >
                <div>
                  <p className="font-medium">{b.guestName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {b.id} · {b.room} · {b.checkIn} → {b.checkOut} · RWF{" "}
                    {b.amount.toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  icon={<Icon name="ShieldCheck" className="h-4 w-4" />}
                  onClick={() => handleVerify(b)}
                  disabled={busy === b.id}
                >
                  {busy === b.id ? "Verifying…" : "Verify"}
                </Button>
              </li>
            ))}
            {pending.length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                No pending reservations — {confirmed.length} confirmed booking(s) ready for check-in.
              </p>
            )}
          </ul>
        )}
      </Card>
    </section>
  );
}
