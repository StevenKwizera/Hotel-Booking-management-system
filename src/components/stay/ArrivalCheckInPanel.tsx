import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api, type BookingApi } from "@/lib/api";

export function ArrivalCheckInPanel() {
  const { showToast } = useAppActions();
  const { refresh } = useBackendData();
  const [arrivals, setArrivals] = useState<BookingApi[]>([]);
  const [selected, setSelected] = useState<BookingApi | null>(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getGuestArrivals();
      setArrivals(list);
    } catch {
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async (b: BookingApi) => {
    setBusy(`verify-${b.id}`);
    try {
      await api.verifyBooking(b.id);
      showToast(`Verified ${b.guestName}`, "success");
      await refresh();
      await load();
      if (selected?.id === b.id) {
        setSelected({ ...b, status: "confirmed" });
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Verify failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleCheckIn = async () => {
    if (!selected) return;
    if (!identityVerified) {
      showToast("Verify guest identity before check-in", "warning");
      return;
    }
    if (!roomNumber.trim()) {
      showToast("Enter room number", "warning");
      return;
    }
    setBusy("checkin");
    try {
      await api.workflowCheckIn(selected.id, roomNumber.trim());
      showToast(`Checked in: ${selected.guestName}`, "success");
      setSelected(null);
      setRoomNumber("");
      setIdentityVerified(false);
      await refresh();
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Check-in failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const arrivedCount = arrivals.filter((a) => a.guestArrived).length;

  return (
    <section id="arrival-workflow" className="space-y-4">
      <Card>
        <CardHeader
          title="Arrival & check-in"
          subtitle="Verify booking → assign room → check in guest"
          action={
            arrivedCount > 0 ? (
              <Badge variant="warning">{arrivedCount} arrived</Badge>
            ) : (
              <Badge variant="default">Waiting for arrivals</Badge>
            )
          }
        />

        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading arrivals…</p>
        ) : arrivals.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No guest arrivals scheduled today</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {arrivals.map((a) => (
              <li
                key={a.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
                  selected?.id === a.id
                    ? "border-sky-400/60 bg-sky-50/40 dark:border-sky-500/30 dark:bg-sky-950/20"
                    : "border-[var(--border-subtle)]"
                }`}
              >
                <div>
                  <p className="font-medium">{a.guestName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {a.id} · {a.room || "Room TBD"} · {a.status}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {a.guestArrived && <Badge variant="info">Arrived</Badge>}
                    {a.status === "pending" && <Badge variant="warning">Needs verify</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {a.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerify(a)}
                      disabled={busy !== null}
                    >
                      Verify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={selected?.id === a.id ? "primary" : "outline"}
                    onClick={() => {
                      setSelected(a);
                      const num = a.room?.match(/\d+/)?.[0];
                      if (num) setRoomNumber(num);
                    }}
                  >
                    Select
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <div id="check-in" className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/30 p-4">
            <p className="text-sm font-medium">
              Check in: {selected.guestName} · {selected.id}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={identityVerified}
                onChange={(e) => setIdentityVerified(e.target.checked)}
              />
              Guest identity verified (ID / passport)
            </label>
            <label className="block">
              <span className="text-sm text-[var(--text-secondary)]">Room number</span>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 301"
                className="mt-1 w-full max-w-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
              />
            </label>
            <Button
              icon={<Icon name="DoorOpen" className="h-4 w-4" />}
              onClick={handleCheckIn}
              disabled={busy !== null}
            >
              {busy === "checkin" ? "Checking in…" : "Complete check-in"}
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}
