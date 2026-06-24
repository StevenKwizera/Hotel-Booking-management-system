import type { Booking, GuestPayment, KpiMetric } from "@/types";
import type { OccupancyApi } from "@/lib/api";
import { HOTEL_LOGO_SVG, formatReceiptDate } from "@/lib/hotel-brand";

export type ReportType =
  | "occupancy"
  | "revenue"
  | "payments"
  | "bookings"
  | "operations";

export interface ReportMeta {
  hotelName: string;
  branchName: string;
  reportTitle: string;
  reportType: ReportType;
  dateFrom: string;
  dateTo: string;
  preparedByName: string;
  preparedByRole: string;
  preparedByEmail: string;
}

const REPORT_TITLES: Record<ReportType, string> = {
  occupancy: "Occupancy & Revenue Report",
  revenue: "Revenue Summary Report",
  payments: "Payments & Collections Report",
  bookings: "Reservations Report",
  operations: "Full Operations Report",
};

export function getReportTitle(type: ReportType): string {
  return REPORT_TITLES[type];
}

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inRange(dateStr: string, from: string, to: string): boolean {
  const d = parseDate(dateStr);
  const f = parseDate(from);
  const t = parseDate(to);
  if (!d || !f || !t) return true;
  t.setHours(23, 59, 59, 999);
  return d >= f && d <= t;
}

export function filterBookings(bookings: Booking[], from: string, to: string) {
  return bookings.filter((b) => inRange(b.checkIn, from, to) || inRange(b.checkOut, from, to));
}

export function filterPayments(payments: GuestPayment[], from: string, to: string) {
  return payments.filter((p) => inRange(p.date, from, to));
}

export interface ReportData {
  bookings: Booking[];
  payments: GuestPayment[];
  occupancy: OccupancyApi[];
  kpis: KpiMetric[];
}

function formatRwf(n: number) {
  return `RWF ${n.toLocaleString()}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableRow(cells: string[]) {
  return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
}

function numberedRows(
  rows: string[][],
  emptyColspan: number,
  emptyMessage: string,
): { body: string; count: number } {
  if (rows.length === 0) {
    return {
      body: `<tr><td>—</td><td colspan="${emptyColspan}">${escapeHtml(emptyMessage)}</td></tr>`,
      count: 0,
    };
  }
  const body = rows
    .map((cells, i) => tableRow([String(i + 1), ...cells]))
    .join("");
  return { body, count: rows.length };
}

function dataTable(
  title: string,
  headers: string[],
  rows: string[][],
  emptyMessage: string,
): string {
  const { body, count } = numberedRows(rows, headers.length, emptyMessage);
  const allHeaders = ["#", ...headers];
  return `
    <h2>${escapeHtml(title)} <span class="row-count">(${count} row${count === 1 ? "" : "s"})</span></h2>
    <table>
      <thead><tr>${allHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td colspan="${allHeaders.length}" class="table-foot">Total rows: <strong>${count}</strong></td></tr></tfoot>
    </table>`;
}

export function buildReportHtml(meta: ReportMeta, data: ReportData): string {
  const { reportType, dateFrom, dateTo } = meta;
  const bookings = filterBookings(data.bookings, dateFrom, dateTo);
  const payments = filterPayments(data.payments, dateFrom, dateTo);
  const totalRevenue = bookings.reduce((s, b) => s + b.amount, 0);
  const paidTotal = payments
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);
  const generatedAt = new Date().toLocaleString("en-RW", {
    timeZone: "Africa/Kigali",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const periodLabel = `${formatReceiptDate(dateFrom)} — ${formatReceiptDate(dateTo)}`;

  let bodySections = "";

  if (reportType === "occupancy" || reportType === "revenue" || reportType === "operations") {
    const occRows =
      data.occupancy.length > 0
        ? data.occupancy.map((o) => [escapeHtml(o.day), `${o.occupancy ?? 0}%`, `${o.revenue ?? 0}M`])
        : [];
    bodySections += dataTable(
      "Occupancy trend",
      ["Day", "Occupancy", "Revenue (M RWF)"],
      occRows,
      "No occupancy data in selected period",
    );
  }

  if (reportType === "bookings" || reportType === "operations") {
    const bookRows = bookings.map((b) => [
      escapeHtml(b.id),
      escapeHtml(b.guestName),
      escapeHtml(b.room),
      escapeHtml(b.checkIn),
      escapeHtml(b.checkOut),
      escapeHtml(b.status),
      formatRwf(b.amount),
    ]);
    bodySections += dataTable(
      "Reservations",
      ["ID", "Guest", "Room", "Check-in", "Check-out", "Status", "Amount"],
      bookRows,
      "No bookings in selected period",
    );
  }

  if (reportType === "payments" || reportType === "operations") {
    const payRows = payments.map((p) => [
      escapeHtml(p.id),
      escapeHtml(p.method),
      formatRwf(p.amount),
      escapeHtml(p.status),
      escapeHtml(p.date),
    ]);
    bodySections += dataTable(
      "Payments & collections",
      ["ID", "Method", "Amount", "Status", "Date"],
      payRows,
      "No payments in selected period",
    );
  }

  if (reportType === "revenue" || reportType === "operations") {
    bodySections += `
      <div class="summary-grid">
        <div class="summary-card"><span>Booking revenue</span><strong>${formatRwf(totalRevenue)}</strong></div>
        <div class="summary-card"><span>Payments collected</span><strong>${formatRwf(paidTotal)}</strong></div>
        <div class="summary-card"><span>Bookings count</span><strong>${bookings.length}</strong></div>
        <div class="summary-card"><span>Transactions</span><strong>${payments.length}</strong></div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(meta.reportTitle)} — ${escapeHtml(meta.hotelName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", system-ui, sans-serif; color: #1a2e1a; margin: 0; padding: 32px; background: #f8faf8; }
    .report { max-width: 920px; margin: 0 auto; background: #fff; border: 1px solid #d4e4d4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(26,46,26,.08); }
    .report-header { display: flex; flex-wrap: wrap; align-items: stretch; justify-content: space-between; gap: 24px; padding: 28px 32px; background: linear-gradient(135deg, #f0f7f2 0%, #fff 55%); border-bottom: 2px solid #1e4d3a; }
    .header-brand { display: flex; align-items: flex-start; gap: 18px; flex: 1; min-width: 260px; }
    .logo-wrap { flex-shrink: 0; }
    .logo-wrap svg { width: 64px; height: 64px; display: block; }
    .header-text { text-align: left; }
    .report-title { margin: 0; font-size: 1.5rem; font-family: Georgia, "Times New Roman", serif; color: #1e4d3a; font-weight: 700; line-height: 1.25; }
    .hotel-line { margin: 6px 0 0; font-size: 0.95rem; color: #2d5a45; font-weight: 600; }
    .branch-line { margin: 3px 0 0; font-size: 0.82rem; color: #5a6b5a; }
    .header-meta { flex-shrink: 0; min-width: 200px; max-width: 280px; align-self: center; background: #fff; border: 1px solid #c5dcc5; border-radius: 10px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(30,77,58,.06); }
    .meta-row + .meta-row { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e8f3ec; }
    .meta-label { margin: 0; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: #5a6b5a; font-weight: 600; }
    .meta-value { margin: 4px 0 0; font-size: 0.88rem; color: #1e4d3a; font-weight: 600; line-height: 1.4; }
    .content { padding: 28px 32px 24px; }
    h2 { font-size: 1rem; color: #1e4d3a; margin: 24px 0 12px; border-bottom: 2px solid #1e4d3a; padding-bottom: 6px; }
    h2:first-child { margin-top: 0; }
    .row-count { font-weight: 500; font-size: 0.85rem; color: #5a6b5a; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 4px; }
    th, td { border: 1px solid #e0ebe0; padding: 8px 10px; text-align: left; }
    th { background: #1e4d3a; color: #fff; font-weight: 600; }
    th:first-child, td:first-child { text-align: center; width: 42px; font-weight: 600; color: #1e4d3a; background: #f0f7f2; }
    thead th:first-child { background: #163d2e; color: #fff; }
    tr:nth-child(even) td:not(:first-child) { background: #f8fbf9; }
    .table-foot { background: #f0f7f2; font-size: 0.8rem; color: #5a6b5a; text-align: right; font-style: italic; }
    .table-foot strong { color: #1e4d3a; font-style: normal; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
    .summary-card { background: #f0f7f2; border: 1px solid #c5dcc5; border-radius: 8px; padding: 14px 16px; }
    .summary-card span { display: block; font-size: 0.75rem; color: #5a6b5a; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card strong { font-size: 1.15rem; color: #1e4d3a; margin-top: 4px; display: block; }
    .sign-off { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 32px; padding: 28px 32px 32px; border-top: 2px solid #1e4d3a; background: #fafcfa; }
    .prepared-by { flex: 1; min-width: 220px; }
    .prepared-by .label { margin: 0 0 8px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #5a6b5a; font-weight: 600; }
    .prepared-by .name { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e4d3a; }
    .prepared-by .role { margin: 4px 0 0; font-size: 0.9rem; color: #2d5a45; }
    .prepared-by .email { margin: 2px 0 0; font-size: 0.82rem; color: #5a6b5a; }
    .signature-stamp { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-end; }
    .signature-box, .stamp-box { text-align: center; min-width: 160px; }
    .signature-box .sig-label, .stamp-box .stamp-label { margin: 0 0 10px; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6b5a; font-weight: 600; }
    .signature-line { width: 180px; height: 1px; background: #1e4d3a; margin: 48px auto 6px; }
    .signature-hint { font-size: 0.72rem; color: #8a9a8a; }
    .stamp-circle { width: 100px; height: 100px; border: 3px double #1e4d3a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 0.7rem; font-weight: 700; color: #1e4d3a; letter-spacing: 0.12em; opacity: 0.55; transform: rotate(-12deg); }
    .footer { padding: 12px 32px; background: #f0f7f2; font-size: 0.72rem; color: #5a6b5a; text-align: center; border-top: 1px solid #d4e4d4; }
    @media print {
      body { padding: 0; background: #fff; }
      .report { box-shadow: none; border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="report">
    <header class="report-header">
      <div class="header-brand">
        <div class="logo-wrap" aria-hidden="true">${HOTEL_LOGO_SVG.replace('width="56" height="56"', 'width="64" height="64"')}</div>
        <div class="header-text">
          <h1 class="report-title">${escapeHtml(meta.reportTitle)}</h1>
          <p class="hotel-line">${escapeHtml(meta.hotelName)}</p>
          <p class="branch-line">${escapeHtml(meta.branchName)}</p>
        </div>
      </div>
      <aside class="header-meta">
        <div class="meta-row">
          <p class="meta-label">Date generated</p>
          <p class="meta-value">${escapeHtml(generatedAt)}</p>
        </div>
        <div class="meta-row">
          <p class="meta-label">Report period</p>
          <p class="meta-value">${escapeHtml(periodLabel)}</p>
        </div>
      </aside>
    </header>
    <div class="content">${bodySections}</div>
    <div class="sign-off">
      <div class="prepared-by">
        <p class="label">Prepared by</p>
        <p class="name">${escapeHtml(meta.preparedByName)}</p>
        <p class="role">${escapeHtml(meta.preparedByRole)}</p>
        <p class="email">${escapeHtml(meta.preparedByEmail)}</p>
      </div>
      <div class="signature-stamp">
        <div class="signature-box">
          <p class="sig-label">Authorized signature</p>
          <div class="signature-line"></div>
          <p class="signature-hint">Sign above</p>
        </div>
        <div class="stamp-box">
          <p class="stamp-label">Official stamp</p>
          <div class="stamp-circle">STAMP</div>
        </div>
      </div>
    </div>
    <footer class="footer">
      Confidential — ${escapeHtml(meta.hotelName)} · Powered by Orkestra HMS · Net Luna Villa / AUCA
    </footer>
  </div>
</body>
</html>`;
}

export function openReportPrintPreview(html: string) {
  const win = window.open("", "_blank", "width=960,height=720");
  if (!win) {
    throw new Error("Pop-up blocked. Allow pop-ups to print or download the report.");
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export function downloadReportHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
