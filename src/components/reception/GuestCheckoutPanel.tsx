import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { useGuestData } from "@/context/GuestDataContext";
import { api, type CheckoutBillApi, type InvoiceApi } from "@/lib/api";
import { PaypackPhoneField } from "@/components/payments/PaypackPhoneField";
import { isMtnRwandaPhone, normalizeMtnPhoneInput } from "@/lib/payment-providers";

const CHECKOUT_STEPS = [
  { id: "request", label: "Request check-out" },
  { id: "bill", label: "System calculates bill" },
  { id: "verify", label: "Reception verifies charges" },
  { id: "pay", label: "Pay remaining balance" },
  { id: "invoice", label: "Invoice generated" },
  { id: "room", label: "Room marked available" },
  { id: "history", label: "Guest history saved" },
] as const;

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

function stepStatus(
  stepId: (typeof CHECKOUT_STEPS)[number]["id"],
  bill: CheckoutBillApi | null,
  bookingStatus: string,
): "done" | "active" | "pending" {
  if (!bill) return stepId === "request" ? "active" : "pending";
  switch (stepId) {
    case "request":
      return bill.checkoutRequested ? "done" : "active";
    case "bill":
      return bill.checkoutRequested ? "done" : "pending";
    case "verify":
      if (bill.chargesVerified) return "done";
      return bill.checkoutRequested ? "active" : "pending";
    case "pay":
      if (bill.balanceDueRwf === 0 && bill.chargesVerified) return "done";
      return bill.chargesVerified && bill.balanceDueRwf > 0 ? "active" : "pending";
    case "invoice":
      if (bill.invoiceIssued || bookingStatus === "checked-out") return "done";
      return bill.balanceDueRwf === 0 && bill.chargesVerified ? "active" : "pending";
    case "room":
    case "history":
      return bookingStatus === "checked-out" ? "done" : "pending";
    default:
      return "pending";
  }
}

export function GuestCheckoutPanel() {
  const { showToast } = useAppActions();
  const guest = useGuestData();
  const [bill, setBill] = useState<CheckoutBillApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payPhone, setPayPhone] = useState("");

  const activeBooking = guest.bookings.find((b) => b.status === "checked-in");

  const loadBill = useCallback(async () => {
    if (!activeBooking) return;
    setLoading(true);
    try {
      setBill(await api.getCheckoutBill(activeBooking.id));
    } catch {
      setBill(null);
    } finally {
      setLoading(false);
    }
  }, [activeBooking]);

  useEffect(() => {
    loadBill();
  }, [loadBill, guest.balance, activeBooking?.checkoutRequested, activeBooking?.status]);

  const handleRequestCheckout = async () => {
    if (!activeBooking) return;
    try {
      const res = await api.guestCheckoutRequest(activeBooking.id);
      showToast(res.message, "success");
      await guest.refresh();
      await loadBill();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Request failed", "error");
    }
  };

  const handlePayBalance = async () => {
    if (!bill || bill.balanceDueRwf <= 0) return;
    if (!payPhone.trim()) {
      showToast("Enter your MTN MoMo number", "warning");
      return;
    }
    if (!isMtnRwandaPhone(payPhone)) {
      showToast("Use a valid MTN number (078… or 079…)", "warning");
      return;
    }
    setPaying(true);
    try {
      await guest.processPayment(bill.balanceDueRwf, normalizeMtnPhoneInput(payPhone));
      showToast(`Paid RWF ${bill.balanceDueRwf.toLocaleString()}`, "success");
      await guest.refresh();
      await loadBill();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Payment failed", "error");
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!activeBooking) return;
    try {
      const inv = await api.getInvoice(activeBooking.id);
      downloadInvoice(inv);
      showToast("Invoice downloaded", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Invoice not ready yet", "error");
    }
  };

  if (!activeBooking) {
    return (
      <Card>
        <CardHeader title="Check-out" subtitle="Available when you are checked in" />
        <p className="text-sm text-[var(--text-muted)]">
          After arrival, reception will complete your check-in. You can then request check-out here.
        </p>
      </Card>
    );
  }

  return (
    <section id="guest-checkout" className="space-y-4">
      <Card>
        <CardHeader
          title="Check-out workflow"
          subtitle={`${activeBooking.room} · ${activeBooking.id}`}
          action={
            <Button size="sm" variant="outline" onClick={loadBill} disabled={loading}>
              Refresh
            </Button>
          }
        />

        <ol className="mb-6 space-y-2">
          {CHECKOUT_STEPS.map((step) => {
            const status = stepStatus(step.id, bill, activeBooking.status);
            return (
              <li
                key={step.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                  status === "done"
                    ? "border-emerald-300/50 bg-emerald-50/40 dark:border-emerald-500/25 dark:bg-emerald-950/20"
                    : status === "active"
                      ? "border-teal-300/50 bg-teal-50/40 dark:border-teal-500/25 dark:bg-teal-950/20"
                      : "border-[var(--border-subtle)]"
                }`}
              >
                <Icon
                  name={status === "done" ? "CheckCircle2" : status === "active" ? "CircleDot" : "Circle"}
                  className={`h-4 w-4 shrink-0 ${
                    status === "done"
                      ? "text-emerald-600"
                      : status === "active"
                        ? "text-teal-600"
                        : "text-[var(--text-muted)]"
                  }`}
                />
                <span className={status === "pending" ? "text-[var(--text-muted)]" : "font-medium"}>
                  {step.label}
                </span>
                {status === "done" && <Badge variant="success">Done</Badge>}
                {status === "active" && <Badge variant="info">Now</Badge>}
              </li>
            );
          })}
        </ol>

        {bill && (
          <div className="mb-4 grid gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/40 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Room charges</p>
              <p className="font-semibold">RWF {bill.roomChargesRwf.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">
                Services ({bill.serviceCount})
              </p>
              <p className="font-semibold">RWF {bill.servicesRwf.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Total bill</p>
              <p className="font-display text-lg font-semibold">
                RWF {bill.totalRwf.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Balance due</p>
              <p
                className={`font-semibold ${bill.balanceDueRwf > 0 ? "text-amber-600" : "text-emerald-600"}`}
              >
                RWF {bill.balanceDueRwf.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!bill?.checkoutRequested && (
            <Button icon={<Icon name="LogOut" className="h-4 w-4" />} onClick={handleRequestCheckout}>
              Request check-out
            </Button>
          )}
          {bill?.chargesVerified && bill.balanceDueRwf > 0 && (
            <>
              <div className="w-full basis-full">
                <PaypackPhoneField value={payPhone} onChange={setPayPhone} />
              </div>
              <Button
                icon={<Icon name="CreditCard" className="h-4 w-4" />}
                onClick={handlePayBalance}
                disabled={paying}
              >
                {paying ? "Processing…" : `Pay via Paypack — RWF ${bill.balanceDueRwf.toLocaleString()}`}
              </Button>
            </>
          )}
          {bill?.chargesVerified && bill.balanceDueRwf === 0 && (
            <Button variant="outline" onClick={handleDownloadInvoice}>
              Download invoice
            </Button>
          )}
          <Link to="/payments">
            <Button variant="outline" size="sm">
              Payment history
            </Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}
