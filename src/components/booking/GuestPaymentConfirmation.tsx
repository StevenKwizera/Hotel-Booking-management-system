import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useSettings } from "@/context/SettingsContext";
import { formatReceiptDate } from "@/lib/hotel-brand";
import {
  downloadPaymentReceipt,
  nightsBetween,
  printPaymentReceipt,
  type PaymentReceiptData,
} from "@/lib/payment-receipt";
import type { Booking } from "@/types";

interface GuestPaymentConfirmationProps {
  booking: Booking;
  paymentCode: string;
  amountPaid: number;
  paymentDate: string;
  paypackReference?: string | null;
  confirmationEmail?: string;
  emailSent?: boolean;
}

export function GuestPaymentConfirmation({
  booking,
  paymentCode,
  amountPaid,
  paymentDate,
  paypackReference,
  confirmationEmail,
  emailSent = true,
}: GuestPaymentConfirmationProps) {
  const { hotelName, branchName } = useSettings();
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const receiptEmail = confirmationEmail;

  const receiptData: PaymentReceiptData = {
    hotelName,
    branchName,
    guestName: booking.guestName,
    guestEmail: receiptEmail ?? undefined,
    bookingCode: booking.id,
    room: booking.room,
    roomType: booking.roomType,
    guestCount: booking.guestCount,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights,
    amountPaid,
    bookingTotal: booking.amount,
    paymentCode,
    paypackReference,
    paymentDate,
  };

  return (
    <div
      id="payment-confirmed"
      className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm dark:border-emerald-800/40 dark:from-emerald-950/40 dark:to-[var(--bg-elevated)]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Icon name="CheckCircle" className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-emerald-100">
            Payment confirmed — your booking is secured
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900/85 dark:text-emerald-100/85">
            <strong>RWF {amountPaid.toLocaleString()}</strong> received via Paypack MoMo for{" "}
            <strong>{booking.room}</strong> at {hotelName}. Your stay from{" "}
            <strong>{booking.checkIn}</strong> to <strong>{booking.checkOut}</strong> ({nights}{" "}
            night{nights === 1 ? "" : "s"}) is confirmed.
          </p>
          {emailSent && receiptEmail && (
            <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              A detailed confirmation with your receipt was emailed to{" "}
              <strong>{receiptEmail}</strong>.
            </p>
          )}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 rounded-lg border border-emerald-100 bg-white/80 p-4 text-sm dark:border-emerald-900/30 dark:bg-emerald-950/20 sm:grid-cols-2">
        <div>
          <dt className="text-[var(--text-muted)]">Guest</dt>
          <dd className="font-medium">{booking.guestName}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Hotel</dt>
          <dd className="font-medium">{hotelName}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Room</dt>
          <dd className="font-medium">
            {booking.room}
            {booking.roomType ? ` · ${booking.roomType}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Booking ref.</dt>
          <dd className="font-medium">{booking.id}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Check-in</dt>
          <dd className="font-medium">{formatReceiptDate(booking.checkIn)}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Check-out</dt>
          <dd className="font-medium">{formatReceiptDate(booking.checkOut)}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Amount paid</dt>
          <dd className="font-semibold text-emerald-700 dark:text-emerald-300">
            RWF {amountPaid.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Receipt no.</dt>
          <dd className="font-medium">{paymentCode}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          onClick={() => printPaymentReceipt(receiptData)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Icon name="Printer" className="mr-2 h-4 w-4" />
          Print receipt
        </Button>
        <Button variant="outline" onClick={() => downloadPaymentReceipt(receiptData)}>
          <Icon name="Download" className="mr-2 h-4 w-4" />
          Download receipt
        </Button>
        <Link to="/payments">
          <Button variant="outline">Payment history</Button>
        </Link>
      </div>
    </div>
  );
}
