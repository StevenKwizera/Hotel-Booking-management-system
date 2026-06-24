import { useState } from "react";

import { Card, CardHeader } from "@/components/ui/Card";

import { Button } from "@/components/ui/Button";

import { Badge } from "@/components/ui/Badge";

import { Icon } from "@/components/ui/Icon";

import { FilterChip } from "@/components/ui/FilterChip";

import { DataTable } from "@/components/ui/DataTable";

import { useAppActions } from "@/context/AppActionsContext";

import { useAuth } from "@/context/AuthContext";

import { useGuestData } from "@/context/GuestDataContext";

import { useBackendData } from "@/context/BackendDataContext";


import type { Booking } from "@/types";
import { countCancellationsThisWeek } from "@/lib/page-helpers";
import { api } from "@/lib/api";
import { GuestBookingFlowPanel } from "@/components/booking/GuestBookingFlowPanel";
import { GuestBookingStatusBanner } from "@/components/booking/GuestBookingStatusBanner";
import { BookingVerifyPanel } from "@/components/reception/BookingVerifyPanel";
import { BookingApprovalPanel } from "@/components/reception/BookingApprovalPanel";
import { useHashScroll } from "@/hooks/useHashScroll";



const FILTERS = ["All", "Confirmed", "Approved", "Pending", "Checked-in", "Cancelled"] as const;



export function ReservationsPage() {

  const { user } = useAuth();

  const { openModal, showToast } = useAppActions();

  const guest = useGuestData();

  const backend = useBackendData();

  const isGuest = user?.role === "guest";
  const isReception =
    user?.role === "receptionist" || user?.role === "admin" || user?.role === "management";
  useHashScroll();



  const [filter, setFilter] = useState<string>(isReception ? "Pending" : "All");
  const [editing, setEditing] = useState<Booking | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");

  const displayBookings = isGuest ? guest.bookings : backend.bookings;

  const availableRooms = backend.availableRooms;



  const filtered =

    filter === "All"

      ? displayBookings

      : displayBookings.filter((b) => b.status === filter.toLowerCase());

  const cancellationsWeek = countCancellationsThisWeek(backend.bookings);

  const handleCancel = async (b: Booking) => {
    if (!confirm(`Cancel booking ${b.id}?`)) return;
    try {
      await api.cancelBooking(b.id);
      await backend.refresh();
      if (isGuest) await guest.refresh();
      showToast(`Booking ${b.id} cancelled`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Cancel failed", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await api.updateBooking(editing.id, {
        checkIn: editCheckIn || undefined,
        checkOut: editCheckOut || undefined,
      });
      await backend.refresh();
      if (isGuest) await guest.refresh();
      showToast(`Booking ${editing.id} updated`, "success");
      setEditing(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed", "error");
    }
  };

  const handleVerify = async (b: Booking) => {
    try {
      await api.verifyBooking(b.id);
      showToast(`Verified: ${b.guestName} — ${b.id}`, "success");
      await backend.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Verification failed", "error");
    }
  };

  const columns = [

    { key: "id", header: "ID", render: (r: Booking) => <span className="font-medium">{r.id}</span> },

    ...(isGuest
      ? []
      : [
          { key: "guest", header: "Guest", render: (r: Booking) => r.guestName },
          {
            key: "email",
            header: "Email",
            render: (r: Booking) => (
              <span className="text-[var(--text-muted)]">{r.guestEmail ?? "—"}</span>
            ),
          },
        ]),

    { key: "room", header: "Room", render: (r: Booking) => r.room },

    ...(isGuest

      ? [{ key: "type", header: "Type", render: (r: Booking) => r.roomType ?? "—" }]

      : []),

    { key: "in", header: "Check-in", render: (r: Booking) => r.checkIn },

    { key: "out", header: "Check-out", render: (r: Booking) => r.checkOut },

    {

      key: "status",

      header: "Status",

      render: (r: Booking) => <Badge variant="info">{r.status}</Badge>,

    },

    {

      key: "actions",

      header: "",

      render: (r: Booking) => (
        <div className="flex gap-1">
          {r.status === "pending" && !isGuest && (
            <Button variant="ghost" size="sm" onClick={() => handleVerify(r)}>
              Verify
            </Button>
          )}
          {(r.status === "confirmed" || r.status === "pending") && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(r);
                  setEditCheckIn(r.checkIn);
                  setEditCheckOut(r.checkOut);
                }}
              >
                Modify
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleCancel(r)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      ),

    },

  ];



  return (

    <div className="space-y-6">

      {isReception && <BookingApprovalPanel />}
      {isReception && <BookingVerifyPanel />}

      <div className="grid gap-4 md:grid-cols-3">

        {[

          {

            label: isGuest ? "Rooms available" : "Available Rooms",

            value: String(availableRooms),

            icon: "Bed",

          },

          {

            label: isGuest ? "My bookings" : "Pending Bookings",

            value: String(

              isGuest

                ? guest.bookings.length

                : backend.bookings.filter((b) => b.status === "pending").length,

            ),

            icon: "Clock",

          },

          {

            label: isGuest ? "Total spend" : "Cancellations (week)",

            value: isGuest

              ? `RWF ${guest.bookings.reduce((s, b) => s + b.amount, 0).toLocaleString()}`

              : String(cancellationsWeek),

            icon: isGuest ? "Wallet" : "XCircle",

          },

        ].map((s) => (

          <button

            key={s.label}

            type="button"

            onClick={() => showToast(`${s.label}: ${s.value}`, "info")}

            className="flex cursor-pointer items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-left transition-all hover:border-[var(--accent)]/30 hover:shadow-md active:scale-[0.99]"

          >

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/12">

              <Icon name={s.icon} className="h-6 w-6 text-[var(--accent)]" />

            </div>

            <div>

              <p className="text-2xl font-semibold">{s.value}</p>

              <p className="text-sm text-[var(--text-muted)]">{s.label}</p>

            </div>

          </button>

        ))}

      </div>



      {isGuest && <GuestBookingStatusBanner />}
      {isGuest && <GuestBookingFlowPanel />}

      <section id="bookings">
      <Card>

        <CardHeader

          title={isGuest ? "My bookings" : "Booking Calendar & Records"}

          subtitle={

            isGuest

              ? "Your reservations at Net Luna Villa"

              : "Room availability, reservations & cancellations"

          }

          action={

            !isGuest ? (

              <Button

                icon={<Icon name="Plus" className="h-4 w-4" />}

                onClick={() => openModal("new-reservation")}

              >

                New Reservation

              </Button>

            ) : undefined

          }

        />

        {!isGuest && (

          <div className="mb-4 flex flex-wrap gap-2">

            {FILTERS.map((f) => (

              <FilterChip

                key={f}

                label={f}

                active={filter === f}

                onClick={() => {

                  setFilter(f);

                  showToast(`Filter: ${f}`, "info");

                }}

              />

            ))}

          </div>

        )}

        {isGuest && guest.bookings.length === 0 ? (

          <p className="py-8 text-center text-sm text-[var(--text-muted)]">

            No bookings yet — use the form above to book your first stay.

          </p>

        ) : (

          <DataTable columns={columns} data={filtered} keyField="id" />

        )}

      </Card>
      </section>

      {editing && (
        <Card>
          <CardHeader title={`Modify ${editing.id}`} subtitle={editing.room} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-[var(--text-secondary)]">Check-in</span>
              <input
                type="date"
                value={editCheckIn}
                onChange={(e) => setEditCheckIn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-[var(--text-secondary)]">Check-out</span>
              <input
                type="date"
                value={editCheckOut}
                onChange={(e) => setEditCheckOut(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSaveEdit}>Save changes</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

    </div>

  );

}

