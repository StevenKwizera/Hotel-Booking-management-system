import { HOTEL_LOGO_SVG, formatReceiptDate } from "@/lib/hotel-brand";
import type { GuestPayment } from "@/types";

export interface PaymentReceiptData {
  hotelName: string;
  branchName?: string;
  guestName: string;
  guestEmail?: string;
  bookingCode: string;
  room: string;
  roomType?: string;
  guestCount?: number;
  checkIn: string;
  checkOut: string;
  nights?: number;
  amountPaid: number;
  bookingTotal?: number;
  paymentCode: string;
  paypackReference?: string | null;
  paymentDate: string;
  method?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn.includes("T") ? checkIn : `${checkIn}T12:00:00`);
  const end = new Date(checkOut.includes("T") ? checkOut : `${checkOut}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

export function buildPaymentReceiptHtml(data: PaymentReceiptData): string {
  const nights = data.nights ?? nightsBetween(data.checkIn, data.checkOut);
  const method = data.method ?? "MTN Mobile Money (Paypack)";
  const branch = data.branchName ?? "Kigali";
  const checkInFmt = formatReceiptDate(data.checkIn);
  const checkOutFmt = formatReceiptDate(data.checkOut);
  const roomLine = data.roomType ? `${data.room} · ${data.roomType}` : data.room;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(data.paymentCode)} — ${escapeHtml(data.hotelName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", system-ui, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 720px; margin: 0 auto; }
    .receipt {
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1);
      border: 1px solid #e2e8f0;
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 28px 32px;
      background: linear-gradient(135deg, #1a4d3a 0%, #0d9488 100%);
      color: #fff;
    }
    .brand { display: flex; align-items: center; gap: 16px; }
    .brand-text h1 { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; }
    .brand-text p { font-size: 0.85rem; opacity: 0.92; margin-top: 4px; }
    .paid-badge {
      text-align: center;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.35);
      border-radius: 12px;
      padding: 12px 18px;
      min-width: 100px;
    }
    .paid-badge strong { display: block; font-size: 1.1rem; letter-spacing: 0.08em; }
    .paid-badge span { font-size: 0.7rem; opacity: 0.9; text-transform: uppercase; }
    .content { padding: 28px 32px 32px; }
    .amount-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 24px;
    }
    .amount-bar .label { font-size: 0.75rem; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.1em; }
    .amount-bar .value { font-size: 2rem; font-weight: 800; color: #059669; }
    .section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
    }
    .stay-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 24px;
    }
    .stay-box {
      border: 2px solid #0d9488;
      border-radius: 12px;
      padding: 16px 18px;
      background: #f0fdfa;
    }
    .stay-box.checkout { border-color: #64748b; background: #f8fafc; }
    .stay-box .lbl { font-size: 0.7rem; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 0.08em; }
    .stay-box.checkout .lbl { color: #64748b; }
    .stay-box .date { font-size: 1.05rem; font-weight: 700; margin-top: 6px; line-height: 1.35; color: #0f172a; }
    .stay-box .time-note { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 24px;
      margin-bottom: 24px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9rem;
    }
    .detail-row span:first-child { color: #64748b; }
    .detail-row span:last-child { font-weight: 600; text-align: right; }
    .footer {
      margin-top: 8px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
      font-size: 0.78rem;
      color: #64748b;
      line-height: 1.6;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border: none; }
    }
    @media (max-width: 560px) {
      .stay-grid, .details-grid { grid-template-columns: 1fr; }
      .top { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="receipt">
      <div class="top">
        <div class="brand">
          ${HOTEL_LOGO_SVG}
          <div class="brand-text">
            <h1>${escapeHtml(data.hotelName)}</h1>
            <p>${escapeHtml(branch)} · Official payment receipt</p>
          </div>
        </div>
        <div class="paid-badge">
          <strong>PAID</strong>
          <span>Confirmed</span>
        </div>
      </div>

      <div class="content">
        <div class="amount-bar">
          <div>
            <div class="label">Amount received</div>
            <div class="value">RWF ${data.amountPaid.toLocaleString()}</div>
          </div>
          <div style="text-align:right;font-size:0.85rem;color:#047857;">
            <div><strong>Receipt:</strong> ${escapeHtml(data.paymentCode)}</div>
            <div style="margin-top:4px;">${escapeHtml(data.paymentDate)}</div>
          </div>
        </div>

        <p class="section-title">Your stay — check-in &amp; check-out</p>
        <div class="stay-grid">
          <div class="stay-box">
            <div class="lbl">Check-in</div>
            <div class="date">${escapeHtml(checkInFmt)}</div>
            <div class="time-note">From 14:00 · Booking ${escapeHtml(data.bookingCode)}</div>
          </div>
          <div class="stay-box checkout">
            <div class="lbl">Check-out</div>
            <div class="date">${escapeHtml(checkOutFmt)}</div>
            <div class="time-note">Before 11:00 · ${nights} night${nights === 1 ? "" : "s"}</div>
          </div>
        </div>

        <p class="section-title">Guest &amp; reservation</p>
        <div class="details-grid">
          <div>
            <div class="detail-row"><span>Guest name</span><span>${escapeHtml(data.guestName)}</span></div>
            ${data.guestEmail ? `<div class="detail-row"><span>Email</span><span>${escapeHtml(data.guestEmail)}</span></div>` : ""}
            <div class="detail-row"><span>Room</span><span>${escapeHtml(roomLine)}</span></div>
            ${data.guestCount ? `<div class="detail-row"><span>Guests</span><span>${data.guestCount}</span></div>` : ""}
          </div>
          <div>
            <div class="detail-row"><span>Booking ref.</span><span>${escapeHtml(data.bookingCode)}</span></div>
            ${data.bookingTotal != null ? `<div class="detail-row"><span>Booking total</span><span>RWF ${data.bookingTotal.toLocaleString()}</span></div>` : ""}
            <div class="detail-row"><span>Payment method</span><span>${escapeHtml(method)}</span></div>
            ${data.paypackReference ? `<div class="detail-row"><span>Paypack ref.</span><span style="font-size:0.78rem;">${escapeHtml(data.paypackReference)}</span></div>` : ""}
          </div>
        </div>

        <div class="footer">
          Thank you for choosing <strong>${escapeHtml(data.hotelName)}</strong>.<br />
          This receipt confirms your Paypack MoMo payment and reservation.<br />
          Present this receipt at reception on check-in · Powered by Orkestra Hospitality
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadPaymentReceipt(data: PaymentReceiptData): void {
  const html = buildPaymentReceiptHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${data.paymentCode}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printPaymentReceipt(data: PaymentReceiptData): void {
  const html = buildPaymentReceiptHtml(data);
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=780,height=920");
  if (!printWindow) {
    downloadPaymentReceipt(data);
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function receiptFromBookingPayment(
  booking: {
    id: string;
    guestName: string;
    guestEmail?: string;
    room: string;
    roomType?: string;
    guestCount?: number;
    checkIn: string;
    checkOut: string;
    amount: number;
  },
  payment: {
    id: string;
    amount: number;
    date: string;
    reference?: string | null;
    method?: string;
  },
  hotelName: string,
  branchName?: string,
): PaymentReceiptData {
  return {
    hotelName,
    branchName,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    bookingCode: booking.id,
    room: booking.room,
    roomType: booking.roomType,
    guestCount: booking.guestCount,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    amountPaid: payment.amount,
    bookingTotal: booking.amount,
    paymentCode: payment.id,
    paypackReference: payment.reference,
    paymentDate: payment.date,
    method: payment.method ?? "MTN Mobile Money (Paypack)",
  };
}

/** Build receipt from enriched payment API (always includes stay dates from backend). */
export function receiptFromPayment(
  payment: GuestPayment,
  hotelName: string,
  branchName?: string,
  fallbackGuestName?: string,
  fallbackGuestEmail?: string,
): PaymentReceiptData {
  return {
    hotelName,
    branchName,
    guestName: payment.guestName ?? fallbackGuestName ?? "Guest",
    guestEmail: payment.confirmationEmail ?? undefined,
    bookingCode: payment.bookingCode ?? "—",
    room: payment.room ?? "—",
    roomType: payment.roomType,
    guestCount: payment.guestCount,
    checkIn: payment.checkIn ?? "—",
    checkOut: payment.checkOut ?? "—",
    amountPaid: payment.amount,
    bookingTotal: payment.bookingTotal,
    paymentCode: payment.id,
    paypackReference: payment.reference,
    paymentDate: payment.date,
    method: payment.method ?? "MTN Mobile Money (Paypack)",
  };
}
