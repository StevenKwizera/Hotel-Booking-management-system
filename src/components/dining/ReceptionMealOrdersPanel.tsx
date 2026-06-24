import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { api, type MealOrderApi } from "@/lib/api";

export function ReceptionMealOrdersPanel() {
  const { user } = useAuth();
  const { showToast } = useAppActions();
  const [orders, setOrders] = useState<MealOrderApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [serverNames, setServerNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await api.getMealOrders());
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (id: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(id);
    try {
      await fn();
      showToast(success, "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Action failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (orderCode: string) => {
    if (rejectReason.trim().length < 5) {
      showToast("Explain why the order is declined (min 5 characters)", "warning");
      return;
    }
    await run(
      orderCode,
      () => api.rejectMealOrder(orderCode, rejectReason.trim()),
      "Order declined — guest notified",
    );
    setRejectId(null);
    setRejectReason("");
  };

  return (
    <Card>
      <CardHeader
        title="Guest meal orders"
        subtitle="Approve or decline, then track kitchen prep and room service"
        action={
          <Button size="sm" variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No meal orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{o.id}</span>
                    <Badge variant="info">{o.mealCategory}</Badge>
                    <Badge>{o.status.replace(/-/g, " ")}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {o.guestName} · Room {o.room} · {o.guestEmail}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{o.createdAt}</p>
                </div>
                <p className="font-display text-lg font-bold">RWF {o.totalRwf.toLocaleString()}</p>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.items.map((i) => (
                  <li key={i.menuItemId}>
                    {i.quantity}× {i.itemName} — RWF {i.lineTotalRwf.toLocaleString()}
                  </li>
                ))}
              </ul>
              {o.guestNotes && (
                <p className="mt-2 text-sm italic text-[var(--text-muted)]">Note: {o.guestNotes}</p>
              )}
              {o.rejectionReason && (
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">Declined: {o.rejectionReason}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {o.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      loading={busy === o.id}
                      icon={<Icon name="Check" className="h-4 w-4" />}
                      onClick={() =>
                        void run(o.id, () => api.approveMealOrder(o.id), "Approved — guest can pay")
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectId(o.id);
                        setRejectReason("");
                      }}
                    >
                      Decline
                    </Button>
                  </>
                )}
                {o.status === "sent-to-kitchen" && (
                  <Button
                    size="sm"
                    loading={busy === o.id}
                    onClick={() =>
                      void run(o.id, () => api.startMealPreparing(o.id), "Chef notified — preparing")
                    }
                  >
                    Chef preparing
                  </Button>
                )}
                {o.status === "preparing" && (
                  <Button
                    size="sm"
                    loading={busy === o.id}
                    onClick={() => void run(o.id, () => api.markMealReady(o.id), "Marked ready to serve")}
                  >
                    Ready for service
                  </Button>
                )}
                {(o.status === "ready" || o.status === "serving") && (
                  <>
                    <input
                      value={serverNames[o.id] ?? user?.name ?? ""}
                      onChange={(e) => setServerNames((prev) => ({ ...prev, [o.id]: e.target.value }))}
                      placeholder="Server name"
                      className="rounded-lg border border-[var(--border-default)] px-2 py-1 text-sm"
                    />
                    <Button
                      size="sm"
                      loading={busy === o.id}
                      onClick={() =>
                        void run(
                          o.id,
                          () => api.assignMealServer(o.id, serverNames[o.id] ?? user?.name ?? "Staff"),
                          "Server assigned",
                        )
                      }
                    >
                      Assign & serve
                    </Button>
                  </>
                )}
                {o.status === "serving" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busy === o.id}
                    onClick={() => void run(o.id, () => api.markMealServed(o.id), "Marked as served")}
                  >
                    Mark served
                  </Button>
                )}
              </div>

              {rejectId === o.id && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
                  <label className="block text-sm font-medium">Reason for declining (guest will see this)</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
                    placeholder="e.g. Item unavailable today, kitchen closed for lunch…"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setRejectId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" loading={busy === o.id} onClick={() => void handleReject(o.id)}>
                      Confirm decline
                    </Button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
