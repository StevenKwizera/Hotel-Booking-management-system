import { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { Card, CardHeader } from "@/components/ui/Card";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Icon } from "@/components/ui/Icon";

import { Modal, ModalFooter } from "@/components/ui/Modal";

import { EmptyState } from "@/components/ui/EmptyState";

import { PaymentMethodPicker } from "@/components/payments/PaymentMethodPicker";

import { PaypackPhoneField } from "@/components/payments/PaypackPhoneField";

import { PaymentProviderLogo } from "@/components/payments/PaymentProviderLogo";

import { RevenueMonitorPanel } from "@/components/finance/RevenueMonitorPanel";

import { useAppActions } from "@/context/AppActionsContext";

import { useAuth } from "@/context/AuthContext";

import { useGuestData } from "@/context/GuestDataContext";

import { useBackendData } from "@/context/BackendDataContext";

import { useHashScroll } from "@/hooks/useHashScroll";

import { formatRwf, sumPayments } from "@/lib/page-helpers";

import { isMtnRwandaPhone, normalizeMtnPhoneInput, resolvePaymentMethodLabel } from "@/lib/payment-providers";

import { downloadPaymentReceipt, printPaymentReceipt, receiptFromBookingPayment, receiptFromPayment } from "@/lib/payment-receipt";

import { useSettings } from "@/context/SettingsContext";

import { api, type PaymentApi } from "@/lib/api";



function paymentBadgeVariant(status: string): "success" | "warning" | "danger" | "default" {

  if (status === "completed") return "success";

  if (status === "flagged") return "danger";

  if (status === "pending") return "warning";

  return "default";

}



export function PaymentsPage() {

  const { user } = useAuth();

  const { openModal, showToast } = useAppActions();

  const guest = useGuestData();

  const { hotelName, branchName } = useSettings();

  const backend = useBackendData();

  const isGuest = user?.role === "guest";

  const isFinance = user?.role === "finance" || user?.role === "admin";

  useHashScroll();



  const [payOpen, setPayOpen] = useState(false);

  const [amount, setAmount] = useState("");

  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);



  const staffStats = useMemo(() => {

    const completed = backend.payments.filter((p) => p.status === "completed");

    const pending = backend.payments.filter((p) => p.status === "pending");

    const todayTotal = sumPayments(completed, () => true);

    const pendingTotal = sumPayments(pending, () => true);

    return {

      today: formatRwf(todayTotal),

      pending: formatRwf(pendingTotal),

      count: backend.payments.length,

    };

  }, [backend.payments]);



  const handlePay = async () => {

    const parsed = amount ? Number(amount) : guest.balance;

    if (!Number.isFinite(parsed) || parsed <= 0) {

      showToast("Enter a valid amount", "warning");

      return;

    }

    if (!phone.trim()) {

      showToast("Enter your MTN MoMo number", "warning");

      return;

    }

    if (!isMtnRwandaPhone(phone)) {

      showToast("Use a valid MTN number (078… or 079…)", "warning");

      return;

    }

    setLoading(true);

    try {

      await guest.processPayment(parsed, normalizeMtnPhoneInput(phone));

      setPayOpen(false);

      setAmount("");

      showToast(`Paypack payment initiated — RWF ${parsed.toLocaleString()}`, "success");

    } catch (e) {

      showToast(e instanceof Error ? e.message : "Payment failed", "error");

    } finally {

      setLoading(false);

    }

  };



  if (isGuest) {

    return (

      <div className="space-y-6">

        <Card className="border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/5 to-transparent">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)]/15">

                <Icon name="Wallet" className="h-7 w-7 text-[var(--accent)]" />

              </div>

              <div>

                <p className="text-sm text-[var(--text-muted)]">My balance</p>

                <p className="font-display text-3xl font-semibold">

                  RWF {guest.balance.toLocaleString()}

                </p>

                <p className="text-sm text-[var(--text-muted)]">

                  {guest.room} · Pay with Paypack MoMo

                </p>

              </div>

            </div>

            <Button

              icon={<Icon name="CreditCard" className="h-4 w-4" />}

              onClick={() => {

                setAmount(String(guest.balance));

                setPayOpen(true);

              }}

              disabled={guest.balance <= 0}

            >

              Pay with Paypack

            </Button>

          </div>

        </Card>



        <Card>

          <CardHeader title="Payment channel" subtitle="Paypack mobile money only" />

          <PaymentMethodPicker />

        </Card>



        <Card>

          <CardHeader title="Payment history" subtitle="Your Paypack transactions at Net Luna Villa" />

          {guest.payments.length === 0 ? (

            <EmptyState

              icon="Receipt"

              title="No payments yet"

              description="Your folio charges and Paypack payments will appear here."

            />

          ) : (

            <ul className="space-y-3">

              {guest.payments.map((t) => (

                <li

                  key={t.id}

                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border-subtle)] px-4 py-3"

                >

                  <div className="flex flex-1 items-center gap-3">

                    <PaymentProviderLogo provider={t.method} size="sm" />

                    <div>

                      <p className="font-medium">{t.id}</p>

                      <p className="text-sm text-[var(--text-muted)]">

                        {resolvePaymentMethodLabel(t.method)} · {t.date}

                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-3">

                    <div className="text-right">

                      <p className="font-semibold">RWF {t.amount.toLocaleString()}</p>

                      <Badge variant={t.status === "completed" ? "success" : "warning"}>

                        {t.status}

                      </Badge>

                    </div>

                    <Button

                      size="sm"

                      variant="outline"

                      onClick={() => {
                        const linkedBooking = t.bookingCode
                          ? guest.bookings.find((b) => b.id === t.bookingCode)
                          : undefined;
                        const receipt = linkedBooking
                          ? receiptFromBookingPayment(linkedBooking, t, hotelName, branchName)
                          : receiptFromPayment(t, hotelName, branchName, user?.name, user?.email);
                        printPaymentReceipt(receipt);
                      }}

                    >

                      Print

                    </Button>

                    <Button

                      size="sm"

                      variant="outline"

                      onClick={() => {
                        const linkedBooking = t.bookingCode
                          ? guest.bookings.find((b) => b.id === t.bookingCode)
                          : undefined;
                        if (linkedBooking) {
                          downloadPaymentReceipt(
                            receiptFromBookingPayment(linkedBooking, t, hotelName, branchName),
                          );
                        } else {
                          downloadPaymentReceipt(
                            receiptFromPayment(t, hotelName, branchName, user?.name, user?.email),
                          );
                        }
                      }}

                    >

                      Receipt

                    </Button>

                  </div>

                </li>

              ))}

            </ul>

          )}

        </Card>



        <Modal

          open={payOpen}

          onClose={() => setPayOpen(false)}

          title="Pay with Paypack"

          subtitle="Mobile money payment"

          footer={

            <ModalFooter

              onCancel={() => setPayOpen(false)}

              onConfirm={handlePay}

              confirmLabel="Pay via Paypack MoMo"

              loading={loading}

            />

          }

        >

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto">

            <label className="block">

              <span className="text-sm text-[var(--text-secondary)]">Amount (RWF)</span>

              <input

                type="number"

                value={amount}

                onChange={(e) => setAmount(e.target.value)}

                className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"

              />

            </label>

            <PaypackPhoneField value={phone} onChange={setPhone} />

            <PaymentMethodPicker />

          </div>

        </Modal>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      <Card className="flex flex-wrap items-center justify-between gap-4">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--bg-muted)]">

            <Icon name="Wallet" className="h-7 w-7 text-[var(--accent)]" />

          </div>

          <div>

            <h2 className="font-display text-lg font-semibold">Paypack payments</h2>

            <p className="text-sm text-[var(--text-muted)]">

              All guest payments via Paypack MoMo · {staffStats.count} transactions

            </p>

          </div>

        </div>

        <Button

          variant="outline"

          onClick={async () => {

            if (!isFinance) {

              showToast("Finance officer must approve pending payments", "warning");

              return;

            }

            const pending = backend.payments.filter((p) => p.status === "pending");

            if (pending.length === 0) {

              showToast("No pending payments to reconcile", "info");

              return;

            }

            let ok = 0;

            for (const p of pending) {

              try {

                await api.processPayment(p.id);

                ok++;

              } catch {

                /* skip */

              }

            }

            await backend.refresh();

            showToast(`Reconciled ${ok} of ${pending.length} pending payment(s)`, "success");

          }}

        >

          Reconcile pending

        </Button>

      </Card>



      <Card>

        <CardHeader title="Payment channel" subtitle="Paypack MoMo — guests & front desk" />

        <PaymentMethodPicker />

        <p className="mt-3 text-xs text-[var(--text-muted)]">

          Guests pay via Paypack when booking or settling their balance. Staff record Paypack reference codes.

        </p>

      </Card>



      <div className="grid gap-4 sm:grid-cols-3">

        {[

          { label: "Completed total", value: staffStats.today },

          { label: "Pending", value: staffStats.pending },

          { label: "Transactions", value: String(staffStats.count) },

        ].map((s) => (

          <Card key={s.label} className="p-4">

            <p className="text-xl font-semibold">{s.value}</p>

            <p className="text-sm text-[var(--text-muted)]">{s.label}</p>

          </Card>

        ))}

      </div>



      {isFinance && (

        <div className="grid gap-4 md:grid-cols-2">

          <section id="verify">

            <Card className="h-full border-emerald-200/40 dark:border-emerald-500/20">

              <CardHeader

                title="Verify transactions"

                subtitle="Match Paypack references and mark finance-verified"

              />

              <p className="text-sm text-[var(--text-muted)]">

                Use <strong>Verify</strong> on each row below after checking amount and Paypack reference.

              </p>

              <p className="mt-2 text-xs text-[var(--text-muted)]">

                {backend.payments.filter((p) => p.verified).length} of {backend.payments.length}{" "}

                verified

              </p>

            </Card>

          </section>

          <section id="approve-flag">

            <Card className="h-full border-amber-200/40 dark:border-amber-500/20">

              <CardHeader

                title="Approve or flag"

                subtitle="Complete pending Paypack payments or flag for investigation"

              />

              <ul className="space-y-1 text-sm text-[var(--text-secondary)]">

                <li>

                  <strong>Approve</strong> — pending → completed

                </li>

                <li>

                  <strong>Flag</strong> — mark suspicious (duplicate, mismatch)

                </li>

                <li>

                  <strong>Refund</strong> — reverse completed payment

                </li>

              </ul>

            </Card>

          </section>

        </div>

      )}



      <section id="all-payments">

        <Card>

          <CardHeader

            title="All transactions"

            subtitle="Paypack payment ledger"

            action={

              <Button

                icon={<Icon name="Plus" className="h-4 w-4" />}

                onClick={() => openModal("record-payment")}

              >

                Record payment

              </Button>

            }

          />

          {backend.loading ? (

            <p className="py-8 text-center text-sm text-[var(--text-muted)]">Loading payments…</p>

          ) : backend.payments.length === 0 ? (

            <EmptyState

              icon="CreditCard"

              title="No transactions yet"

              description="Record a Paypack payment or wait for guest check-outs."

              action={

                <Button size="sm" onClick={() => openModal("record-payment")}>

                  Record payment

                </Button>

              }

            />

          ) : (

            <ul className="space-y-3">

              {backend.payments.map((t) => (

                <PaymentRow

                  key={t.id}

                  t={{

                    id: t.id,

                    guestName: t.guestName ?? "—",

                    amount: t.amount,

                    method: t.method,

                    status: t.status,

                    date: t.date,

                    verified: t.verified,

                    reference: t.reference,

                  }}

                  isFinance={isFinance}

                  onRefresh={backend.refresh}

                  showToast={showToast}

                />

              ))}

            </ul>

          )}

        </Card>

      </section>



      {isFinance && (

        <>

          <RevenueMonitorPanel />

          <Card className="flex flex-wrap items-center justify-between gap-3 border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">

            <p className="text-sm text-[var(--text-muted)]">

              Generate formal financial reports for accounting and leadership.

            </p>

            <Link to="/reports#reports">

              <Button variant="outline" size="sm" icon={<Icon name="FileText" className="h-4 w-4" />}>

                Financial reports

              </Button>

            </Link>

          </Card>

        </>

      )}

    </div>

  );

}



function PaymentRow({

  t,

  isFinance,

  onRefresh,

  showToast,

}: {

  t: PaymentApi;

  isFinance: boolean;

  onRefresh: () => Promise<void>;

  showToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;

}) {

  return (

    <li className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border-subtle)] px-4 py-3">

      <div className="flex items-center gap-3">

        <PaymentProviderLogo provider={t.method} size="sm" />

        <div>

          <p className="font-medium">{t.id}</p>

          <p className="text-sm text-[var(--text-muted)]">

            {t.guestName} · {resolvePaymentMethodLabel(t.method)} · {t.date}

          </p>

          {t.reference && <p className="text-xs text-[var(--text-muted)]">Ref: {t.reference}</p>}

        </div>

      </div>

      <div className="flex flex-wrap items-center gap-2">

        <div className="text-right">

          <p className="font-semibold">RWF {t.amount.toLocaleString()}</p>

          <div className="flex flex-wrap justify-end gap-1">

            <Badge variant={paymentBadgeVariant(t.status)}>{t.status}</Badge>

            {t.verified && <Badge variant="success">verified</Badge>}

          </div>

        </div>

        {isFinance && t.status !== "refunded" && !t.verified && (

          <Button

            size="sm"

            variant="outline"

            onClick={async () => {

              try {

                await api.verifyPayment(t.id);

                await onRefresh();

                showToast(`Verified ${t.id}`, "success");

              } catch (e) {

                showToast(e instanceof Error ? e.message : "Verify failed", "error");

              }

            }}

          >

            Verify

          </Button>

        )}

        {isFinance && t.status === "pending" && (

          <Button

            size="sm"

            onClick={async () => {

              try {

                await api.processPayment(t.id);

                await onRefresh();

                showToast(`Approved ${t.id}`, "success");

              } catch (e) {

                showToast(e instanceof Error ? e.message : "Approve failed", "error");

              }

            }}

          >

            Approve

          </Button>

        )}

        {isFinance && t.status !== "refunded" && t.status !== "flagged" && (

          <Button

            size="sm"

            variant="outline"

            onClick={async () => {

              if (!confirm(`Flag ${t.id} for review?`)) return;

              try {

                await api.flagPayment(t.id);

                await onRefresh();

                showToast(`Flagged ${t.id}`, "warning");

              } catch (e) {

                showToast(e instanceof Error ? e.message : "Flag failed", "error");

              }

            }}

          >

            Flag

          </Button>

        )}

        {!isFinance && t.status === "pending" && (

          <Button

            size="sm"

            onClick={async () => {

              try {

                await api.processPayment(t.id);

                await onRefresh();

                showToast(`Processed ${t.id}`, "success");

              } catch (e) {

                showToast(e instanceof Error ? e.message : "Failed", "error");

              }

            }}

          >

            Process

          </Button>

        )}

        {isFinance && t.status === "completed" && (

          <Button

            size="sm"

            variant="outline"

            onClick={async () => {

              if (!confirm(`Refund ${t.id}?`)) return;

              try {

                await api.refundPayment(t.id);

                await onRefresh();

                showToast(`Refunded ${t.id}`, "success");

              } catch (e) {

                showToast(e instanceof Error ? e.message : "Refund failed", "error");

              }

            }}

          >

            Refund

          </Button>

        )}

      </div>

    </li>

  );

}

