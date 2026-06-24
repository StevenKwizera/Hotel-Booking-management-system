import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppActions } from "@/context/AppActionsContext";
import { useBackendData } from "@/context/BackendDataContext";
import { api, type CheckoutBillApi, type InvoiceApi, type BookingApi } from "@/lib/api";

function downloadInvoice(inv: InvoiceApi) {
  const html = `<!DOCTYPE html><html><head><title>Invoice ${inv.bookingCode}</title></head><body style="font-family:sans-serif;padding:2rem">
<h1>Net Luna Villa — Invoice</h1>
<p><strong>${inv.bookingCode}</strong> · ${inv.issuedAt}</p>
<p>Guest: ${inv.guestName}</p>
<p>Room: ${inv.room}</p>
<table border="1" cellpadding="8" style="border-collapse:collapse;margin-top:1rem">
<tr><td>Room charges</td><td>RWF ${inv.roomChargesRwf.toLocaleString()}</td></tr>
<tr><td>Services</td><td>RWF ${inv.servicesRwf.toLocaleString()}</td></tr>
<tr><td><strong>Total</strong></td><td><strong>RWF ${inv.totalRwf.toLocaleString()}</strong></td></tr>
</table></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${inv.bookingCode}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function CheckoutRow({
  booking,
  onRefresh,
}: {
  booking: BookingApi;
  onRefresh: () => void;
}) {
  const { showToast } = useAppActions();
  const { refresh } = useBackendData();
  const [bill, setBill] = useState<CheckoutBillApi | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.getCheckoutBill(booking.id).then(setBill).catch(() => setBill(null));
  }, [booking.id, booking.chargesVerified, booking.invoiceIssued]);

  const verify = async () => {
    setBusy("verify");
    try {
      const updated = await api.verifyCheckoutCharges(booking.id);
      setBill(updated);
      showToast(`Charges verified — total RWF ${updated.totalRwf.toLocaleString()}`, "success");
      await refresh();
      onRefresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Verify failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const issueInvoice = async () => {
    setBusy("invoice");
    try {
      const inv = await api.issueCheckoutInvoice(booking.id);
      downloadInvoice(inv);
      showToast(`Invoice issued for ${booking.id}`, "success");
      await refresh();
      onRefresh();
      setBill(await api.getCheckoutBill(booking.id));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Invoice failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const completeCheckout = async () => {
    setBusy("checkout");
    try {
      await api.workflowCheckOut(booking.id);
      showToast(`${booking.guestName} checked out — room available, history saved`, "success");
      await refresh();
      onRefresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Check-out failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="rounded-xl border border-teal-200/40 bg-teal-50/20 p-4 dark:border-teal-500/20 dark:bg-teal-950/15">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{booking.guestName}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {booking.id} · {booking.room} · depart {booking.checkOut}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="info">Requested</Badge>
          {bill?.chargesVerified && <Badge variant="success">Verified</Badge>}
          {bill && bill.balanceDueRwf > 0 && (
            <Badge variant="warning">Due RWF {bill.balanceDueRwf.toLocaleString()}</Badge>
          )}
          {bill?.invoiceIssued && <Badge variant="success">Invoiced</Badge>}
        </div>
      </div>

      {bill && (
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
          <div>
            <span className="text-[var(--text-muted)]">Room </span>
            RWF {bill.roomChargesRwf.toLocaleString()}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Services </span>
            RWF {bill.servicesRwf.toLocaleString()}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Total </span>
            <strong>RWF {bill.totalRwf.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Balance </span>
            RWF {bill.balanceDueRwf.toLocaleString()}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!bill?.chargesVerified && (
          <Button size="sm" onClick={verify} disabled={busy !== null}>
            {busy === "verify" ? "Verifying…" : "Verify charges"}
          </Button>
        )}
        {bill?.chargesVerified && bill.balanceDueRwf === 0 && !bill.invoiceIssued && (
          <Button size="sm" variant="outline" onClick={issueInvoice} disabled={busy !== null}>
            {busy === "invoice" ? "Generating…" : "Generate invoice"}
          </Button>
        )}
        {bill?.canCompleteCheckout && (
          <Button size="sm" onClick={completeCheckout} disabled={busy !== null}>
            {busy === "checkout" ? "Processing…" : "Complete check-out"}
          </Button>
        )}
      </div>
    </li>
  );
}

export function ReceptionCheckoutPanel() {
  const [queue, setQueue] = useState<BookingApi[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setQueue(await api.getCheckoutQueue());
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section id="checkout-workflow">
      <Card>
        <CardHeader
          title="Check-out workflow"
          subtitle="Guest request → bill → verify → payment → invoice → release room"
          action={
            <Button size="sm" variant="outline" onClick={load}>
              Refresh
            </Button>
          }
        />
        {loading ? (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading…</p>
        ) : queue.length === 0 ? (
          <EmptyState
            icon="LogOut"
            title="No checkout requests"
            description="When a guest requests check-out, their stay appears here for billing and departure."
          />
        ) : (
          <ul className="space-y-3">
            {queue.map((b) => (
              <CheckoutRow key={b.id} booking={b} onRefresh={load} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
