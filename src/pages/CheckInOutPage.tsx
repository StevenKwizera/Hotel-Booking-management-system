import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { api, type BookingApi, type InvoiceApi } from "@/lib/api";
import { useBackendData } from "@/context/BackendDataContext";
import { ApiStatusBanner } from "@/components/ui/ApiStatusBanner";
import { GuestRequestsQueuePanel } from "@/components/reception/GuestRequestsQueuePanel";
import { GuestCheckoutPanel } from "@/components/reception/GuestCheckoutPanel";
import { ReceptionCheckoutPanel } from "@/components/reception/ReceptionCheckoutPanel";
import { FrontDeskLogPanel } from "@/components/reception/FrontDeskLogPanel";
import { GuestArrivalPanel } from "@/components/stay/GuestArrivalPanel";
import { ArrivalCheckInPanel } from "@/components/stay/ArrivalCheckInPanel";
import { useHashScroll } from "@/hooks/useHashScroll";

function downloadInvoice(inv: InvoiceApi) {
  const html = `<!DOCTYPE html><html><head><title>Invoice ${inv.bookingCode}</title></head><body style="font-family:sans-serif;padding:2rem">
<h1>Net Luna Villa — Invoice</h1>
<p><strong>${inv.bookingCode}</strong> · ${inv.issuedAt}</p>
<p>Guest: ${inv.guestName} (${inv.guestEmail})</p>
<p>Room: ${inv.room}</p>
<table border="1" cellpadding="8" style="border-collapse:collapse;margin-top:1rem">
<tr><td>Room charges</td><td>RWF ${inv.roomChargesRwf.toLocaleString()}</td></tr>
<tr><td>Additional</td><td>RWF ${inv.servicesRwf.toLocaleString()}</td></tr>
<tr><td><strong>Total</strong></td><td><strong>RWF ${inv.totalRwf.toLocaleString()}</strong></td></tr>
<tr><td>Balance due</td><td>RWF ${inv.balanceRwf.toLocaleString()}</td></tr>
</table></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${inv.bookingCode}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CheckInOutPage() {
  const { showToast } = useAppActions();
  const { user, apiConnected } = useAuth();
  const apiOffline = !apiConnected;
  const { refresh } = useBackendData();
  const isGuest = user?.role === "guest";
  const isReception =
    user?.role === "receptionist" || user?.role === "admin" || user?.role === "management";
  useHashScroll();
  const [departures, setDepartures] = useState<BookingApi[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDepartures = async () => {
    if (!apiConnected || isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setDepartures(await api.getTodayDepartures());
    } catch {
      showToast("Could not load departures", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) loadDepartures();
    else setLoading(false);
  }, [apiConnected, isGuest]);

  const handleCheckOut = async (booking: BookingApi) => {
    try {
      await api.workflowCheckOut(booking.id);
      showToast(`Checked out: ${booking.guestName}`, "success");
      await loadDepartures();
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Check-out failed", "error");
    }
  };

  const handleInvoice = async (code: string) => {
    try {
      const inv = await api.getInvoice(code);
      downloadInvoice(inv);
      showToast(`Invoice ${code} downloaded`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Invoice failed", "error");
    }
  };

  if (isGuest) {
    return (
      <div className="space-y-6">
        {apiOffline && <ApiStatusBanner />}
        <GuestArrivalPanel />
        <GuestCheckoutPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {apiOffline && <ApiStatusBanner />}
      {isReception && <ArrivalCheckInPanel />}

      {isReception && <ReceptionCheckoutPanel />}

      <section id="checkout">
        <Card>
          <CardHeader title="Today's departures" subtitle="Quick checkout for departing guests" />
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading…</p>
          ) : departures.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No departures today</p>
          ) : (
            <ul className="space-y-3">
              {departures.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] p-3"
                >
                  <div>
                    <p className="font-medium">{d.guestName}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {d.id} · {d.room} · RWF {d.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleInvoice(d.id)}>
                      Invoice
                    </Button>
                    <Button size="sm" onClick={() => handleCheckOut(d)}>
                      Check out
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section id="bills">
        <Card>
          <CardHeader title="Generate bills" subtitle="Download invoice before departure" />
          {departures.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No departing guests today</p>
          ) : (
            <ul className="space-y-2">
              {departures.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-sm"
                >
                  <span>
                    {d.guestName} · {d.id} · {d.room}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Icon name="Receipt" className="h-4 w-4" />}
                    onClick={() => handleInvoice(d.id)}
                  >
                    Download invoice
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {isReception && <GuestRequestsQueuePanel />}
      {isReception && <FrontDeskLogPanel />}
    </div>
  );
}
