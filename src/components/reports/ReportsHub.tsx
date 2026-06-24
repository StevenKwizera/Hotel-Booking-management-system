import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useBackendData } from "@/context/BackendDataContext";
import { useAppActions } from "@/context/AppActionsContext";
import { ROLE_LABELS } from "@/lib/navigation";
import { reportsForRole } from "@/lib/report-access";
import { HOTEL_LOGO_SVG, formatReceiptDate } from "@/lib/hotel-brand";
import {
  buildReportHtml,
  downloadReportHtml,
  getReportTitle,
  openReportPrintPreview,
  type ReportType,
} from "@/lib/report-generator";

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function ReportsHub() {
  const { user } = useAuth();
  const { hotelName, branchName } = useSettings();
  const { bookings, payments, occupancy, kpis } = useBackendData();
  const { showToast } = useAppActions();
  const defaults = defaultDateRange();

  const allowedReports = useMemo(
    () => (user ? reportsForRole(user.role) : []),
    [user],
  );

  const [reportType, setReportType] = useState<ReportType | null>(null);

  useEffect(() => {
    if (allowedReports.length > 0 && !reportType) {
      setReportType(allowedReports[0].id);
    }
  }, [allowedReports, reportType]);
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [generating, setGenerating] = useState(false);

  const selected = allowedReports.find((r) => r.id === reportType);
  const reportTitle = reportType ? getReportTitle(reportType) : "";

  const previewMeta = useMemo(
    () => ({
      hotelName,
      branchName,
      reportTitle,
      reportType: reportType ?? "operations",
      dateFrom,
      dateTo,
      preparedByName: user?.name ?? "Staff",
      preparedByRole: user ? ROLE_LABELS[user.role] : "User",
      preparedByEmail: user?.email ?? "",
    }),
    [hotelName, branchName, reportTitle, reportType, dateFrom, dateTo, user],
  );

  const buildHtml = () => {
    if (!reportType) throw new Error("Select a report");
    return buildReportHtml(previewMeta, { bookings, payments, occupancy, kpis });
  };

  const validate = () => {
    if (!reportType) {
      showToast("Select a report to generate", "warning");
      return false;
    }
    if (dateFrom > dateTo) {
      showToast("End date must be on or after start date", "warning");
      return false;
    }
    return true;
  };

  const handlePrint = () => {
    if (!validate()) return;
    setGenerating(true);
    try {
      openReportPrintPreview(buildHtml());
      showToast("Report opened — choose Save as PDF in the print dialog", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not open report", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!validate()) return;
    const slug = reportType!.replace(/\s+/g, "-");
    downloadReportHtml(buildHtml(), `orkestra-${slug}-${dateFrom}-to-${dateTo}.html`);
    showToast(`${reportTitle} downloaded`, "success");
  };

  if (allowedReports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Your role does not have permission to generate reports. Contact an administrator.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Branded header */}
      <div className="overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--sidebar-bg)] via-[var(--sidebar-bg)] to-[var(--accent)]/40 text-white shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 p-1 shadow-lg"
              dangerouslySetInnerHTML={{ __html: HOTEL_LOGO_SVG }}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                Authorized reports
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
                {reportTitle || "Reports & Analytics"}
              </h2>
              <p className="text-sm text-white/90">{hotelName}</p>
              <p className="text-xs text-white/75">{branchName}</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-sm backdrop-blur-sm sm:min-w-[200px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65">Date generated</p>
            <p className="mt-0.5 font-medium text-white">
              {new Date().toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <div className="my-2.5 border-t border-white/15" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65">Report period</p>
            <p className="mt-0.5 font-medium text-white">
              {formatReceiptDate(dateFrom)} — {formatReceiptDate(dateTo)}
            </p>
          </div>
        </div>
      </div>

      {/* Date range */}
      <Card className="p-5 sm:p-6">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Report period</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          All figures below are filtered to this date range.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              From
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              To
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </label>
          <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:flex-row">
            <Button
              className="flex-1"
              size="lg"
              icon={<Icon name="Download" className="h-5 w-5" />}
              onClick={handleDownload}
              disabled={!reportType}
            >
              Download report
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              size="lg"
              icon={<Icon name="Printer" className="h-5 w-5" />}
              onClick={handlePrint}
              loading={generating}
              disabled={!reportType}
            >
              Print / PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Report selection */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Select report ({allowedReports.length} available for your role)
          </p>
          {selected && <Badge variant="info">{selected.title}</Badge>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {allowedReports.map((r) => {
            const active = reportType === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setReportType(r.id)}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-md ring-2 ring-[var(--accent)]/25"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/40 hover:shadow-sm"
                }`}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                    <Icon name="Check" className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    active ? "bg-[var(--accent)] text-white" : "bg-[var(--accent)]/12 text-[var(--accent)]"
                  }`}
                >
                  <Icon name={r.icon} className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">
                  {r.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  {r.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      {selected && (
        <Card className="overflow-hidden border-[var(--border-subtle)]">
          <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-muted)] px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Document preview
            </p>
          </div>
          <div className="p-5">
            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-5 border-b border-[var(--border-subtle)] bg-[#f0f7f2] px-6 py-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: HOTEL_LOGO_SVG }}
                  />
                  <div className="text-left">
                    <p className="font-display text-lg font-bold leading-tight text-[#1e4d3a]">
                      {selected.title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#2d5a45]">{hotelName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{branchName}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-[#c5dcc5] bg-white px-4 py-3 shadow-sm sm:min-w-[210px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Date generated
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#1e4d3a]">
                    {new Date().toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <div className="my-2.5 border-t border-[#e8f3ec]" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Report period
                  </p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-[#1e4d3a]">
                    {formatReceiptDate(dateFrom)} — {formatReceiptDate(dateTo)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-6 px-6 py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Prepared by
                  </p>
                  <p className="mt-1 font-semibold text-[var(--text-primary)]">{user?.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {user ? ROLE_LABELS[user.role] : ""}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Signature
                    </p>
                    <div className="mt-8 h-px w-36 bg-[#1e4d3a]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Stamp
                    </p>
                    <div className="mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[#1e4d3a]/40 text-[9px] font-bold text-[#1e4d3a]/50">
                      STAMP
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
              Tables include row numbers (#) and total row counts. Download or print for the full document.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
