import { useCallback, useEffect, useState } from "react";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { useGuestData } from "@/context/GuestDataContext";
import { api } from "@/lib/api";
import { PaypackCheckoutCard } from "@/components/payments/PaypackCheckoutCard";
import { isMtnRwandaPhone, normalizeMtnPhoneInput } from "@/lib/payment-providers";
import { isValidEmail } from "@/lib/payment-receipt";
import { BookingPriceBreakdown } from "@/components/booking/BookingPriceBreakdown";
import { GuestPaymentConfirmation } from "@/components/booking/GuestPaymentConfirmation";
import { bookingNightlyRate, nightsBetween } from "@/lib/guest-data";
import type { Booking } from "@/types";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

interface GuestPaypackCheckoutProps {
  booking: Booking;
}

export function GuestPaypackCheckout({ booking }: GuestPaypackCheckoutProps) {
  const { user } = useAuth();
  const { showToast } = useAppActions();
  const guest = useGuestData();
  const [payPhone, setPayPhone] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [waitingForMoMo, setWaitingForMoMo] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<{
    paymentCode: string;
    amountPaid: number;
    paymentDate: string;
    paypackReference?: string | null;
    confirmationEmail: string;
  } | null>(null);

  const completeIfPaid = useCallback(
    async (paymentId: string, fallbackEmail: string) => {
      const payment = await api.syncPaypackPayment(paymentId);
      if (payment.status === "completed") {
        const sentTo = payment.confirmationEmail?.trim() || fallbackEmail;
        showToast(`Payment confirmed — receipt sent to ${sentTo}`, "success");
        setConfirmedPayment({
          paymentCode: payment.id,
          amountPaid: payment.amount,
          paymentDate: payment.date,
          paypackReference: payment.reference,
          confirmationEmail: sentTo,
        });
        setWaitingForMoMo(false);
        setPendingPaymentId(null);
        setPayMessage(null);
        await guest.refresh();
        return true;
      }
      return false;
    },
    [guest, showToast],
  );

  const pollUntilConfirmed = useCallback(
    async (paymentId: string, email: string) => {
      setPolling(true);
      try {
        for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          if (await completeIfPaid(paymentId, email)) {
            return;
          }
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

  const handleCheckStatus = async () => {
    if (!pendingPaymentId) {
      await guest.refresh();
      return;
    }
    setPolling(true);
    try {
      const email = confirmationEmail.trim();
      if (await completeIfPaid(pendingPaymentId, email)) {
        return;
      }
      await guest.refresh();
      showToast("Payment not confirmed yet — approve the MoMo prompt on your phone", "warning");
    } finally {
      setPolling(false);
    }
  };

  useEffect(() => {
    if (waitingForMoMo && pendingPaymentId && !polling && !confirmedPayment) {
      const timer = setInterval(async () => {
        await completeIfPaid(pendingPaymentId, confirmationEmail.trim());
      }, POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }
  }, [
    waitingForMoMo,
    pendingPaymentId,
    polling,
    confirmedPayment,
    confirmationEmail,
    completeIfPaid,
  ]);

  const handlePay = async () => {
    const raw = payPhone.trim();
    const email = confirmationEmail.trim();
    if (!raw) {
      showToast("Enter your MTN MoMo number", "warning");
      return;
    }
    if (!isMtnRwandaPhone(raw)) {
      showToast("Use a valid MTN number (078… or 079…)", "warning");
      return;
    }
    if (!email || !isValidEmail(email)) {
      showToast("Enter a valid email for your payment confirmation", "warning");
      return;
    }
    const phone = normalizeMtnPhoneInput(raw);
    setPaying(true);
    setPayMessage(null);
    setWaitingForMoMo(false);
    try {
      const result = await api.payBookingWithPaypack(booking.id, phone, email);
      setPayMessage(result.message);
      showToast(result.message, "success");
      if (result.paymentId) {
        setPendingPaymentId(result.paymentId);
        await pollUntilConfirmed(result.paymentId, email);
      }
      await guest.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Payment failed", "error");
    } finally {
      setPaying(false);
    }
  };

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const nightlyRate = bookingNightlyRate(booking);
  const subtotal = booking.grossAmount ?? booking.amount;
  const discountRwf = booking.discountRwf ?? 0;
  const totalDue = booking.amount;

  if (confirmedPayment) {
    return (
      <GuestPaymentConfirmation
        booking={{ ...booking, status: "confirmed" }}
        paymentCode={confirmedPayment.paymentCode}
        amountPaid={confirmedPayment.amountPaid}
        paymentDate={confirmedPayment.paymentDate}
        paypackReference={confirmedPayment.paypackReference}
        confirmationEmail={confirmedPayment.confirmationEmail}
      />
    );
  }

  return (
    <div id="pay-booking" className="py-2">
      <PaypackCheckoutCard
        amountRwf={totalDue}
        meta={`${booking.id} · ${booking.room} · ${booking.checkIn} → ${booking.checkOut}`}
        summary={
          <BookingPriceBreakdown
            nightlyRate={nightlyRate}
            nights={nights}
            subtotal={subtotal}
            discountRwf={discountRwf}
            payable={totalDue}
            earlyBookingDiscount={booking.earlyBookingDiscount}
            repeatGuestDiscount={booking.repeatGuestDiscount}
            compact
          />
        }
        payPhone={payPhone}
        onPayPhoneChange={setPayPhone}
        email={confirmationEmail}
        onEmailChange={setConfirmationEmail}
        emailPlaceholder={user?.email ? `e.g. ${user.email}` : "you@example.com"}
        paying={paying}
        polling={polling}
        waitingForMoMo={waitingForMoMo}
        payMessage={payMessage}
        showCheckStatus={waitingForMoMo || !!pendingPaymentId}
        onPay={handlePay}
        onCheckStatus={handleCheckStatus}
      />
    </div>
  );
}
