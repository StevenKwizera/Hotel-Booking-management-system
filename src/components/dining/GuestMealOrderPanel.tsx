import { useCallback, useEffect, useMemo, useState } from "react";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { FilterChip } from "@/components/ui/FilterChip";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { useGuestData } from "@/context/GuestDataContext";
import { api, type MealOrderApi, type MenuItemApi } from "@/lib/api";
import { PaypackCheckoutCard } from "@/components/payments/PaypackCheckoutCard";
import { isMtnRwandaPhone, normalizeMtnPhoneInput } from "@/lib/payment-providers";
import { isValidEmail } from "@/lib/payment-receipt";
import { HotelImage } from "@/components/ui/HotelImage";
import { MEAL_CATEGORY_IMAGES, mealImageUrl } from "@/lib/meal-images";

const MEALS = ["breakfast", "lunch", "dinner"] as const;

function statusVariant(status: string): "success" | "info" | "warning" | "danger" | "default" {
  if (status === "approved") return "info";
  if (status === "rejected") return "danger";
  if (status === "served") return "success";
  if (status.includes("kitchen") || status === "preparing" || status === "ready" || status === "serving") {
    return "warning";
  }
  return "default";
}

export function GuestMealOrderPanel() {
  const { user } = useAuth();
  const { showToast } = useAppActions();
  const guest = useGuestData();

  const [mealCategory, setMealCategory] = useState<(typeof MEALS)[number]>("breakfast");
  const [menu, setMenu] = useState<MenuItemApi[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [orders, setOrders] = useState<MealOrderApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payPhone, setPayPhone] = useState("");
  const [payEmail, setPayEmail] = useState(user?.email ?? "");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [waitingForMoMo, setWaitingForMoMo] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [chargeAmount, setChargeAmount] = useState<number | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<{
    paymentCode: string;
    amountPaid: number;
    confirmationEmail: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menuItems, orderList] = await Promise.all([
        api.getMealMenu(mealCategory),
        api.getMealOrders(),
      ]);
      setMenu(menuItems);
      setOrders(orderList);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not load menu", "error");
    } finally {
      setLoading(false);
    }
  }, [mealCategory, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const r = guest.room?.replace(/\D/g, "");
    if (r && r !== "—") setRoom(r);
  }, [guest.room]);

  useEffect(() => {
    setCart({});
  }, [mealCategory]);

  const cartLines = useMemo(() => {
    return menu
      .filter((m) => (cart[m.id] ?? 0) > 0)
      .map((m) => ({
        item: m,
        qty: cart[m.id],
        total: m.priceRwf * cart[m.id],
      }));
  }, [menu, cart]);

  const cartTotal = cartLines.reduce((s, l) => s + l.total, 0);

  const approvedOrder = orders.find((o) => o.status === "approved");

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      const q = (next[id] ?? 0) - 1;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  };

  const submitOrder = async () => {
    if (cartLines.length === 0) {
      showToast("Add items to your order", "warning");
      return;
    }
    if (!room.trim()) {
      showToast("Enter your room number", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await api.createMealOrder({
        mealCategory,
        room: room.trim(),
        guestNotes: notes.trim() || undefined,
        items: cartLines.map((l) => ({ menuItemId: l.item.id, quantity: l.qty })),
      });
      showToast("Order sent to reception for approval", "success");
      setCart({});
      setNotes("");
      await load();
      await guest.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not submit order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const completeIfPaid = useCallback(
    async (paymentId: string, email: string) => {
      const payment = await api.syncMealPaypackPayment(paymentId);
      if (payment.status === "completed") {
        const sentTo = payment.confirmationEmail?.trim() || email;
        showToast(`Payment confirmed — receipt sent to ${sentTo}`, "success");
        setConfirmedPayment({
          paymentCode: payment.id,
          amountPaid: payment.amount,
          confirmationEmail: sentTo,
        });
        setWaitingForMoMo(false);
        setPendingPaymentId(null);
        setPayMessage(null);
        await load();
        await guest.refresh();
        return true;
      }
      return false;
    },
    [guest, load, showToast],
  );

  const pollUntilConfirmed = useCallback(
    async (paymentId: string, email: string) => {
      setPolling(true);
      try {
        for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          if (await completeIfPaid(paymentId, email)) return;
        }
        setWaitingForMoMo(true);
        showToast(
          "Still waiting for Paypack — approve on your phone. We'll keep checking automatically.",
          "warning",
        );
      } finally {
        setPolling(false);
      }
    },
    [completeIfPaid, showToast],
  );

  useEffect(() => {
    if (waitingForMoMo && pendingPaymentId && !polling && !confirmedPayment) {
      const timer = setInterval(() => {
        void completeIfPaid(pendingPaymentId, payEmail.trim());
      }, POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }
  }, [waitingForMoMo, pendingPaymentId, polling, confirmedPayment, payEmail, completeIfPaid]);

  const payOrder = async (order: MealOrderApi) => {
    const phone = normalizeMtnPhoneInput(payPhone.trim());
    const email = payEmail.trim();
    if (!isMtnRwandaPhone(phone)) {
      showToast("Enter a valid MTN number (078… or 079…)", "warning");
      return;
    }
    if (!isValidEmail(email)) {
      showToast("Enter a valid email for receipt", "warning");
      return;
    }
    setPayingId(order.id);
    setPayMessage(null);
    setWaitingForMoMo(false);
    try {
      const result = await api.payMealOrderWithPaypack(order.id, phone, email);
      setPayMessage(result.message);
      setChargeAmount(result.amountRwf);
      showToast(result.message, "success");
      if (result.paymentId) {
        setPendingPaymentId(result.paymentId);
        await pollUntilConfirmed(result.paymentId, email);
      }
      await guest.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Payment failed", "error");
    } finally {
      setPayingId(null);
    }
  };

  const handleCheckPayment = async () => {
    if (!pendingPaymentId) {
      await load();
      return;
    }
    setPolling(true);
    try {
      if (await completeIfPaid(pendingPaymentId, payEmail.trim())) return;
      showToast("Payment not confirmed yet — approve the MoMo prompt on your phone", "warning");
    } finally {
      setPolling(false);
    }
  };

  return (
    <div className="space-y-6">
      {confirmedPayment && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 dark:border-emerald-800/40 dark:from-emerald-950/40 dark:to-[var(--bg-elevated)]">
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
            Payment confirmed — kitchen notified
          </h3>
          <p className="mt-2 text-sm text-emerald-900/85 dark:text-emerald-100/85">
            <strong>RWF {confirmedPayment.amountPaid.toLocaleString()}</strong> received via Paypack MoMo.
            Receipt <strong>{confirmedPayment.paymentCode}</strong>
            {confirmedPayment.confirmationEmail
              ? ` — confirmation sent to ${confirmedPayment.confirmationEmail}`
              : ""}
            . Your meal is being prepared.
          </p>
        </Card>
      )}

      {approvedOrder && !confirmedPayment && (
        <PaypackCheckoutCard
          amountRwf={chargeAmount ?? approvedOrder.totalRwf}
          meta={`Order ${approvedOrder.id} · Room ${approvedOrder.room}`}
          summary={
            <ul className="space-y-0.5">
              {approvedOrder.items.map((i) => (
                <li key={i.menuItemId} className="flex justify-between gap-2">
                  <span>
                    {i.quantity}× {i.itemName}
                  </span>
                  <span className="font-medium">RWF {i.lineTotalRwf.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          }
          payPhone={payPhone}
          onPayPhoneChange={setPayPhone}
          email={payEmail}
          onEmailChange={setPayEmail}
          emailPlaceholder={user?.email ? `e.g. ${user.email}` : "you@example.com"}
          paying={payingId === approvedOrder.id}
          polling={polling}
          waitingForMoMo={waitingForMoMo}
          payMessage={payMessage}
          showCheckStatus={waitingForMoMo || !!pendingPaymentId}
          onPay={() => void payOrder(approvedOrder)}
          onCheckStatus={() => void handleCheckPayment()}
        />
      )}

      <Card>
        <CardHeader
          title="Hotel dining menu"
          subtitle="RWF 50–150 per dish (all under 300) — reception approves, then Paypack MoMo like room booking"
        />
        <p className="mb-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-100">
          Test menu prices stay under RWF 300 per dish. You pay only the order total shown at checkout (e.g. 50 + 100 = RWF 150).
        </p>
        <div className="flex flex-wrap gap-2">
          {MEALS.map((m) => (
            <FilterChip
              key={m}
              label={m.charAt(0).toUpperCase() + m.slice(1)}
              active={mealCategory === m}
              onClick={() => setMealCategory(m)}
            />
          ))}
        </div>

        <div className="relative mt-4 overflow-hidden rounded-xl">
          <HotelImage
            src={MEAL_CATEGORY_IMAGES[mealCategory]}
            alt={`${mealCategory} at the hotel`}
            className="aspect-[21/6] w-full min-h-[7rem]"
            overlay
          />
          <div className="absolute inset-0 flex items-end p-4">
            <p className="font-display text-lg font-semibold text-white drop-shadow-sm">
              {mealCategory.charAt(0).toUpperCase() + mealCategory.slice(1)} menu
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading menu…</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menu.map((item) => (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm transition hover:shadow-md"
              >
                <HotelImage
                  src={mealImageUrl(item.id, item.category)}
                  fallbackSrc={MEAL_CATEGORY_IMAGES[item.category]}
                  alt={item.name}
                  className="aspect-[4/3] w-full"
                />
                <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">{item.name}</h3>
                  {(cart[item.id] ?? 0) > 0 && (
                    <Badge variant="info">{cart[item.id]} in cart</Badge>
                  )}
                </div>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-[var(--text-muted)]">{item.description}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-[var(--accent)]">
                    RWF {item.priceRwf.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {(cart[item.id] ?? 0) > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)]"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{cart[item.id]}</span>
                      </>
                    )}
                    <Button size="sm" onClick={() => addToCart(item.id)}>
                      Add
                    </Button>
                  </div>
                </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {cartLines.length > 0 && (
          <section className="mt-6 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 p-4">
            <h3 className="font-semibold">Your order</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {cartLines.map((l) => (
                <li key={l.item.id} className="flex justify-between gap-2">
                  <span>
                    {l.qty}× {l.item.name}
                  </span>
                  <span>RWF {l.total.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right font-display text-lg font-bold">
              Total: RWF {cartTotal.toLocaleString()}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Room number</span>
                <input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. 301"
                  className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">Special requests (optional)</span>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, timing, etc."
                  className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                />
              </label>
            </div>
            <Button
              className="mt-4"
              loading={submitting}
              icon={<Icon name="Send" className="h-4 w-4" />}
              onClick={() => void submitOrder()}
            >
              Submit order to reception
            </Button>
          </section>
        )}
      </Card>

      <Card>
        <CardHeader title="Your meal orders" subtitle="Track approval, payment, and delivery" />
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No orders yet.</p>
          ) : (
            orders.map((o) => (
              <article key={o.id} className="rounded-xl border border-[var(--border-subtle)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{o.id}</span>
                  <Badge variant="info">{o.mealCategory}</Badge>
                  <Badge variant={statusVariant(o.status)}>{o.status.replace(/-/g, " ")}</Badge>
                  <span className="text-sm text-[var(--text-muted)]">Room {o.room}</span>
                </div>
                <ul className="mt-2 text-sm text-[var(--text-secondary)]">
                  {o.items.map((i) => (
                    <li key={i.menuItemId}>
                      {i.quantity}× {i.itemName}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm font-medium">RWF {o.totalRwf.toLocaleString()}</p>
                {o.rejectionReason && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                    Declined: {o.rejectionReason}
                  </p>
                )}
                {o.serverName && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Server: {o.serverName}</p>
                )}
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
