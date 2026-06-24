import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api } from "@/lib/api";
import type { Booking } from "@/types";

export function BookingApprovalPanel() {
  const backend = useBackendData();
  const { showToast } = useAppActions();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  /** Hide rows immediately after approve/reject so they vanish from the dashboard. */
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const pending = useMemo(
    () =>
      backend.bookings.filter((b) => b.status === "pending" && !removedIds.has(b.id)),
    [backend.bookings, removedIds],
  );

  const refreshList = useCallback(async () => {
    setRefreshing(true);
    try {
      await backend.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [backend]);

  useEffect(() => {
    refreshList();
    const timer = setInterval(refreshList, 10000);
    return () => clearInterval(timer);
  }, [refreshList]);

  const markRemoved = (id: string) => {
    setRemovedIds((prev) => new Set(prev).add(id));
  };

  const handleApprove = async (b: Booking) => {
    setBusyId(b.id);
    try {
      await api.approveBooking(b.id);
      markRemoved(b.id);
      showToast(`Approved ${b.id} — removed from queue. Guest can pay now.`, "success");
      await backend.refresh();
      window.dispatchEvent(new CustomEvent("orkestra:bookings-updated"));
    } catch (e) {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(b.id);
        return next;
      });
      showToast(e instanceof Error ? e.message : "Approve failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (b: Booking) => {
    const reason = rejectReason.trim();
    if (!reason) {
      showToast("Enter a reason so the guest knows why the booking was rejected", "warning");
      return;
    }
    setBusyId(b.id);
    try {
      await api.rejectBooking(b.id, reason);
      markRemoved(b.id);
      showToast(`Rejected ${b.id} — removed from queue. Guest notified.`, "success");
      setRejectingId(null);
      setRejectReason("");
      await backend.refresh();
      window.dispatchEvent(new CustomEvent("orkestra:bookings-updated"));
    } catch (e) {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(b.id);
        return next;
      });
      showToast(e instanceof Error ? e.message : "Reject failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card id="pending-approvals" className="border-sky-200/60 bg-white/50 dark:border-sky-500/30 dark:bg-sky-950/10">
      <CardHeader
        title="Guest booking requests"
        subtitle="Approve or reject — handled bookings leave this list immediately"
        action={
          <div className="flex items-center gap-2">
            <Badge variant={pending.length > 0 ? "warning" : "success"}>
              {pending.length} waiting
            </Badge>
            <Button size="sm" variant="outline" onClick={refreshList} disabled={refreshing}>
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        }
      />
      {pending.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No pending requests. New guest bookings appear here automatically.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                <th className="pb-2 pr-3 font-medium">Guest</th>
                <th className="pb-2 pr-3 font-medium">Booking</th>
                <th className="pb-2 pr-3 font-medium">Stay</th>
                <th className="pb-2 pr-3 font-medium">Amount</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((b) => (
                <tr key={b.id} className="border-b border-[var(--border-subtle)] align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium">{b.guestName ?? "Guest"}</p>
                    <p className="text-xs text-[var(--text-muted)]">{b.guestEmail ?? "—"}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <p className="font-medium">{b.id}</p>
                    <p className="text-xs text-[var(--text-muted)]">{b.room}</p>
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    {b.checkIn} → {b.checkOut}
                  </td>
                  <td className="py-3 pr-3 font-medium">RWF {b.amount.toLocaleString()}</td>
                  <td className="py-3">
                    {rejectingId === b.id ? (
                      <div className="min-w-[200px] space-y-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for guest (required)"
                          className="w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="danger"
                            loading={busyId === b.id}
                            onClick={() => handleReject(b)}
                          >
                            Send rejection
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          loading={busyId === b.id}
                          onClick={() => handleApprove(b)}
                          icon={<Icon name="Check" className="h-3.5 w-3.5" />}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingId(b.id);
                            setRejectReason("");
                          }}
                          icon={<Icon name="X" className="h-3.5 w-3.5" />}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
