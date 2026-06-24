import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { FilterChip } from "@/components/ui/FilterChip";
import { Badge } from "@/components/ui/Badge";
import { useAppActions } from "@/context/AppActionsContext";
import { useAuth } from "@/context/AuthContext";
import { useGuestData } from "@/context/GuestDataContext";
import { api, type BookingQuoteApi, type RoomListingApi } from "@/lib/api";
import {
  MAX_ROOM_GUESTS,
  todayIsoDate,
  validateGuestCount,
  validateStayDates,
} from "@/lib/booking-validation";
import { normalizeBookingQuote } from "@/lib/booking-discount";
import { ROOM_TYPE_RATES } from "@/lib/guest-data";
import { GuestRoomBrowser, nightsBetween } from "@/components/reservations/GuestRoomBrowser";
import { BookingPriceBreakdown } from "@/components/booking/BookingPriceBreakdown";
import { GuestPaypackCheckout } from "@/components/booking/GuestPaypackCheckout";
import { GuestPaymentConfirmation } from "@/components/booking/GuestPaymentConfirmation";
import { useHashScroll } from "@/hooks/useHashScroll";
import type { Booking } from "@/types";

const ROOM_TYPES = ["All", "Standard", "Deluxe", "Suite"] as const;

function statusBadge(status: Booking["status"]) {
  switch (status) {
    case "pending":
      return <Badge variant="warning">Awaiting approval</Badge>;
    case "approved":
      return <Badge variant="info">Approved — pay now</Badge>;
    case "confirmed":
      return <Badge variant="success">Confirmed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function GuestBookingFlowPanel() {
  const { apiConnected } = useAuth();
  const { showToast } = useAppActions();
  const guest = useGuestData();
  useHashScroll();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState<(typeof ROOM_TYPES)[number]>("All");
  const [guestCount, setGuestCount] = useState(2);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<"Standard" | "Deluxe" | "Suite">("Deluxe");
  const [roomListings, setRoomListings] = useState<RoomListingApi[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsSearched, setRoomsSearched] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);
  const [totalRoomCount, setTotalRoomCount] = useState(0);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [quote, setQuote] = useState<BookingQuoteApi | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const todayMin = todayIsoDate();
  const nights = nightsBetween(checkIn, checkOut);
  const hasDates = validateStayDates(checkIn, checkOut) === null;
  const guestCountError = validateGuestCount(guestCount);

  const approvedBooking = useMemo(
    () => guest.bookings.find((b) => b.status === "approved"),
    [guest.bookings],
  );
  const confirmedBookingWithPayment = useMemo(() => {
    const confirmed = guest.bookings.find((b) => b.status === "confirmed");
    if (!confirmed) return null;
    const payment =
      guest.payments.find(
        (p) => p.status === "completed" && p.bookingCode === confirmed.id,
      ) ?? guest.payments.find((p) => p.status === "completed");
    if (!payment) return null;
    return { booking: confirmed, payment };
  }, [guest.bookings, guest.payments]);
  const pendingBooking = useMemo(
    () => guest.bookings.find((b) => b.status === "pending"),
    [guest.bookings],
  );
  const lastApprovedNotice = useRef<string | null>(null);

  useEffect(() => {
    if (!approvedBooking) return;
    if (lastApprovedNotice.current === approvedBooking.id) return;
    lastApprovedNotice.current = approvedBooking.id;
    showToast("Your booking was approved — pay with Paypack MoMo below", "success");
  }, [approvedBooking, showToast]);

  const searchRooms = useCallback(async () => {
    const dateError = validateStayDates(checkIn, checkOut);
    if (dateError) {
      showToast(dateError, "warning");
      return;
    }
    const guestsError = validateGuestCount(guestCount);
    if (guestsError) {
      showToast(guestsError, "warning");
      return;
    }
    setRoomsLoading(true);
    setSelectedRoomNumber(null);
    setQuote(null);
    setSubmittedMessage(null);
    try {
      const result = await api.searchRooms({
        checkIn,
        checkOut,
        roomType: roomType === "All" ? undefined : roomType,
        availableOnly: showAvailableOnly,
      });
      setRoomListings(result.rooms);
      setAvailableCount(result.availableCount);
      setTotalRoomCount(result.totalCount);
      setRoomsSearched(true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not load rooms", "error");
      setRoomListings([]);
    } finally {
      setRoomsLoading(false);
    }
  }, [checkIn, checkOut, roomType, showAvailableOnly, guestCount, showToast]);

  useEffect(() => {
    if (!hasDates) return;
    const t = setTimeout(() => searchRooms(), 400);
    return () => clearTimeout(t);
  }, [hasDates, checkIn, checkOut, roomType, showAvailableOnly, searchRooms]);

  const completedStays = useMemo(
    () =>
      guest.bookings.filter((b) =>
        ["confirmed", "checked-in", "checked-out"].includes(b.status),
      ).length,
    [guest.bookings],
  );

  const loadQuote = useCallback(async () => {
    if (!selectedRoomNumber || !hasDates) return;
    setQuoteLoading(true);
    try {
      const q = await api.getBookingQuote({
        checkIn,
        checkOut,
        roomType: selectedRoomType,
        roomNumber: selectedRoomNumber,
        guestCount,
      });
      setQuote(normalizeBookingQuote(q, checkIn, completedStays));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not calculate price", "error");
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [
    checkIn,
    checkOut,
    selectedRoomNumber,
    selectedRoomType,
    guestCount,
    hasDates,
    completedStays,
    showToast,
  ]);

  useEffect(() => {
    if (selectedRoomNumber) loadQuote();
    else setQuote(null);
  }, [selectedRoomNumber, loadQuote]);

  const goToBookingForm = useCallback(() => {
    document.getElementById("submit-request")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSelectRoom = (room: RoomListingApi) => {
    if (!room.availableForDates) {
      showToast("This room is not available for your dates", "warning");
      return;
    }
    setSelectedRoomNumber(room.roomNumber);
    if (room.roomType === "Standard" || room.roomType === "Deluxe" || room.roomType === "Suite") {
      setSelectedRoomType(room.roomType);
    }
    setSubmittedMessage(null);
    showToast(`Room ${room.roomNumber} selected — price summary below`, "success");
    requestAnimationFrame(() => {
      document.getElementById("price")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSubmitRequest = async () => {
    const dateError = validateStayDates(checkIn, checkOut);
    if (dateError) {
      showToast(dateError, "warning");
      return;
    }
    const guestsError = validateGuestCount(guestCount);
    if (guestsError) {
      showToast(guestsError, "warning");
      return;
    }
    if (!selectedRoomNumber || !quote) {
      showToast("Select a room and review price first", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const booking = await api.requestBooking({
        checkIn,
        checkOut,
        roomType: selectedRoomType,
        guestCount,
        roomNumber: selectedRoomNumber,
      });
      setSubmittedMessage(
        `Request ${booking.id} submitted — RWF ${booking.amount.toLocaleString()} for ${quote.nights} night(s). Reception will approve shortly.`,
      );
      showToast("Booking request sent to reception", "success");
      await guest.refresh();
      setSelectedRoomNumber(null);
      setQuote(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Booking request failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!apiConnected) {
    return (
      <Card>
        <CardHeader title="Book a room" subtitle="Connect to the API to search and book" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {(pendingBooking || approvedBooking) && (
        <Card className="border-amber-200/50 bg-amber-50/20 dark:border-amber-500/25">
          <CardHeader title="Your booking requests" subtitle="Track approval and payment" />
          <ul className="space-y-3">
            {guest.bookings
              .filter((b) => b.status === "pending" || b.status === "approved" || b.status === "confirmed")
              .slice(0, 5)
              .map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{b.id}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {b.room} · {b.checkIn} → {b.checkOut} · RWF {b.amount.toLocaleString()}
                    </p>
                  </div>
                  {statusBadge(b.status)}
                </li>
              ))}
          </ul>
        </Card>
      )}

      {approvedBooking && <GuestPaypackCheckout booking={approvedBooking} />}

      {!approvedBooking && confirmedBookingWithPayment && (
        <GuestPaymentConfirmation
          booking={confirmedBookingWithPayment.booking}
          paymentCode={confirmedBookingWithPayment.payment.id}
          amountPaid={confirmedBookingWithPayment.payment.amount}
          paymentDate={confirmedBookingWithPayment.payment.date}
          paypackReference={confirmedBookingWithPayment.payment.reference}
          confirmationEmail={confirmedBookingWithPayment.payment.confirmationEmail ?? undefined}
        />
      )}

      {submittedMessage && (
        <Card className="border-sky-200/50 bg-sky-50/30 dark:border-sky-500/25">
          <CardHeader title="Request submitted" action={<Badge variant="warning">Pending</Badge>} />
          <p className="text-sm">{submittedMessage}</p>
          <Link to="/communications" className="mt-3 inline-block">
            <Button size="sm" variant="outline">
              Check notifications
            </Button>
          </Link>
        </Card>
      )}

      <Card className="border-sky-200/60 dark:border-sky-500/30">
        <CardHeader
          title="Book your stay"
          subtitle="Pick dates, see nightly rate × nights, submit for reception approval, then pay with Paypack"
        />

        <section id="search-dates" className="mb-4 flex flex-wrap gap-2">
          {ROOM_TYPES.map((t) => (
            <FilterChip
              key={t}
              label={t === "All" ? "All types" : t}
              active={roomType === t}
              onClick={() => {
                setRoomType(t);
                setSelectedRoomNumber(null);
              }}
            />
          ))}
        </section>

        <div id="booking-details" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-sm text-[var(--text-secondary)]">Check-in</span>
            <input
              type="date"
              value={checkIn}
              min={todayMin}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setSubmittedMessage(null);
              }}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-[var(--text-secondary)]">Check-out</span>
            <input
              type="date"
              value={checkOut}
              min={checkIn && checkIn >= todayMin ? checkIn : todayMin}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setSubmittedMessage(null);
              }}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-[var(--text-secondary)]">Room type filter</span>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as (typeof ROOM_TYPES)[number])}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            >
              <option value="All">All types</option>
              {ROOM_TYPES.filter((t) => t !== "All").map((t) => (
                <option key={t} value={t}>
                  {t} — from RWF {ROOM_TYPE_RATES[t].toLocaleString()}/night
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-[var(--text-secondary)]">Guests</span>
            <input
              type="number"
              min={1}
              max={MAX_ROOM_GUESTS}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
            {guestCountError ? (
              <p className="mt-1 text-xs text-[var(--danger)]">{guestCountError}</p>
            ) : (
              <p className="mt-1 text-xs text-[var(--text-muted)]">Maximum {MAX_ROOM_GUESTS} guests per room</p>
            )}
          </label>
        </div>

        {hasDates && nights > 0 && (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Stay length: <strong>{nights} night{nights !== 1 ? "s" : ""}</strong> — total = nightly rate ×{" "}
            {nights}
          </p>
        )}

        <div id="availability" className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            icon={<Icon name="Search" className="h-4 w-4" />}
            onClick={searchRooms}
            disabled={roomsLoading}
          >
            {roomsLoading ? "Searching…" : "Search availability"}
          </Button>
          {roomsSearched && (
            <Badge variant="info">
              {availableCount} available · {totalRoomCount} total
            </Badge>
          )}
        </div>

        <section id="select-room" className="mt-8 border-t border-[var(--border-subtle)] pt-6">
          <GuestRoomBrowser
            rooms={roomListings}
            loading={roomsLoading}
            selectedRoomNumber={selectedRoomNumber}
            onSelect={handleSelectRoom}
            onProceedToBooking={selectedRoomNumber ? goToBookingForm : undefined}
            checkIn={checkIn || "—"}
            checkOut={checkOut || "—"}
            nights={nights}
            showAvailableOnly={showAvailableOnly}
            onToggleAvailableOnly={setShowAvailableOnly}
            availableCount={availableCount}
            totalCount={totalRoomCount}
          />
        </section>

        {selectedRoomNumber && quoteLoading && (
          <section
            id="price"
            className="mt-6 rounded-xl border border-sapphire-200/40 bg-sapphire-50/30 p-4 dark:border-sapphire-500/25 dark:bg-sapphire-950/20"
          >
            <p className="text-sm text-[var(--text-muted)]">Calculating price and discounts…</p>
          </section>
        )}

        {quote && selectedRoomNumber && !quoteLoading && (
          <>
            <section
              id="price"
              className="mt-6 rounded-xl border border-sapphire-200/40 bg-sapphire-50/30 p-4 dark:border-sapphire-500/25 dark:bg-sapphire-950/20"
            >
              <h3 className="font-display font-semibold">Price summary</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {quote.roomType} {quote.roomNumber}
              </p>
              <BookingPriceBreakdown
                nightlyRate={quote.nightlyRateRwf}
                nights={quote.nights}
                subtotal={quote.subtotalRwf}
                discountRwf={quote.discountRwf}
                payable={quote.totalRwf}
                earlyBookingDiscount={quote.earlyBookingDiscount}
                repeatGuestDiscount={quote.repeatGuestDiscount}
              />
              {(quote.earlyBookingDiscount || quote.repeatGuestDiscount) && (
                <p className="mt-3 text-xs text-emerald-800 dark:text-emerald-200">
                  Book 14+ days ahead for 5% off. Loyal guests (3+ completed stays) get 10% off. Discounts
                  combine when both apply.
                </p>
              )}
            </section>

            <section
              id="submit-request"
              className="mt-6 scroll-mt-24 space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
            >
              <h3 className="font-display font-semibold">Booking form — submit your request</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Reception or management will approve your request. After approval, pay the full stay total
                (RWF {quote.totalRwf.toLocaleString()}) via Paypack MoMo.
              </p>
              <Button
                icon={<Icon name="CalendarPlus" className="h-4 w-4" />}
                onClick={handleSubmitRequest}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : `Request booking — RWF ${quote.totalRwf.toLocaleString()}`}
              </Button>
            </section>
          </>
        )}
      </Card>
    </div>
  );
}
