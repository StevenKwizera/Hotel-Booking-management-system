import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HotelImage } from "@/components/ui/HotelImage";
import { Modal } from "@/components/ui/Modal";
import { FilterChip } from "@/components/ui/FilterChip";
import { HOTEL_IMAGES } from "@/lib/hotel-images";
import type { RoomListingApi } from "@/lib/api";

const TYPE_IMAGES: Record<string, string> = {
  Standard: HOTEL_IMAGES.rooms.Standard,
  Deluxe: HOTEL_IMAGES.rooms.Deluxe,
  Suite: HOTEL_IMAGES.rooms.Suite,
};

function statusBadgeVariant(status: RoomListingApi["status"]) {
  if (status === "AVAILABLE") return "success" as const;
  if (status === "BOOKED") return "warning" as const;
  return "default" as const;
}

interface GuestRoomBrowserProps {
  rooms: RoomListingApi[];
  loading: boolean;
  selectedRoomNumber: string | null;
  onSelect: (room: RoomListingApi) => void;
  onProceedToBooking?: () => void;
  checkIn: string;
  checkOut: string;
  nights: number;
  showAvailableOnly: boolean;
  onToggleAvailableOnly: (v: boolean) => void;
  availableCount: number;
  totalCount: number;
}

export function GuestRoomBrowser({
  rooms,
  loading,
  selectedRoomNumber,
  onSelect,
  onProceedToBooking,
  checkIn,
  checkOut,
  nights,
  showAvailableOnly,
  onToggleAvailableOnly,
  availableCount,
  totalCount,
}: GuestRoomBrowserProps) {
  const [detailRoom, setDetailRoom] = useState<RoomListingApi | null>(null);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          {checkIn} → {checkOut} · {nights} night{nights === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {availableCount} empty
          </span>
          {showAvailableOnly ? (
            <> · showing available only</>
          ) : (
            <> · {totalCount} rooms total (empty + occupied + booked)</>
          )}
        </p>
        <div className="flex gap-2">
          <FilterChip
            label="All rooms"
            active={!showAvailableOnly}
            onClick={() => onToggleAvailableOnly(false)}
          />
          <FilterChip
            label="Empty only"
            active={showAvailableOnly}
            onClick={() => onToggleAvailableOnly(true)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)]/40 px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available — choose & book
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Booked for your dates
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Occupied — guest in house
        </span>
      </div>

      {selectedRoomNumber && onProceedToBooking && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 dark:border-sky-800/40 dark:bg-sky-950/30">
          <p className="text-sm text-sky-900 dark:text-sky-100">
            <span className="font-semibold">Room {selectedRoomNumber}</span> selected — continue to the booking
            form to submit your request.
          </p>
          <button
            type="button"
            onClick={onProceedToBooking}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Fill booking form
            <Icon name="ArrowRight" className="h-4 w-4" />
          </button>
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border-subtle)] py-12 text-center text-sm text-[var(--text-muted)]">
          No rooms match your filters. Try different dates or show all room types.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const selected = selectedRoomNumber === room.roomNumber;
            const canBook = room.status === "AVAILABLE";
            const img = TYPE_IMAGES[room.roomType] ?? HOTEL_IMAGES.rooms.Standard;

            return (
              <article
                key={room.roomNumber}
                className={`flex flex-col overflow-hidden rounded-xl border-2 bg-[var(--bg-surface)] transition-all ${
                  !canBook
                    ? "border-[var(--border-subtle)] opacity-75"
                    : selected
                      ? "border-sky-500 ring-2 ring-sky-500/25 shadow-md"
                      : "border-[var(--border-subtle)] hover:border-sky-300 hover:shadow-sm"
                }`}
              >
                <div className="relative">
                  <HotelImage src={img} alt={`Room ${room.roomNumber}`} className="aspect-[16/10] w-full" />
                  {!canBook && (
                    <div className="absolute inset-0 bg-slate-900/25" aria-hidden />
                  )}
                  <div className="absolute left-2 top-2">
                    <Badge variant={statusBadgeVariant(room.status)}>{room.statusLabel}</Badge>
                  </div>
                  {selected && canBook && (
                    <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white">
                      <Icon name="Check" className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">Room {room.roomNumber}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{room.floor}</p>
                    </div>
                    <Badge variant="info">{room.roomType}</Badge>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-[var(--text-secondary)]">{room.description}</p>

                  <ul className="mt-2 flex flex-wrap gap-1">
                    {room.amenities.slice(0, 4).map((a) => (
                      <li
                        key={a}
                        className="rounded-md bg-[var(--bg-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                      >
                        {a}
                      </li>
                    ))}
                    {room.amenities.length > 4 && (
                      <li className="text-[10px] text-sky-600">+{room.amenities.length - 4} more</li>
                    )}
                  </ul>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                    <span>{room.bedType}</span>
                    <span>·</span>
                    <span>Up to {room.maxGuests} guests</span>
                    <span>·</span>
                    <span>{room.sizeSqm} m²</span>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">RWF {room.nightlyRateRwf.toLocaleString()}/night</p>
                      {canBook && (
                        <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                          Total: RWF {room.totalForStayRwf.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 sm:flex-row">
                      <Button size="sm" variant="outline" onClick={() => setDetailRoom(room)}>
                        Details
                      </Button>
                      {canBook ? (
                        selected && onProceedToBooking ? (
                          <Button size="sm" onClick={onProceedToBooking}>
                            Book this room
                            <Icon name="ArrowRight" className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => onSelect(room)}
                            variant={selected ? "primary" : "outline"}
                          >
                            {selected ? "Selected" : "Choose"}
                          </Button>
                        )
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          Unavailable
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={detailRoom !== null}
        onClose={() => setDetailRoom(null)}
        title={detailRoom ? `Room ${detailRoom.roomNumber} — ${detailRoom.roomType}` : ""}
        subtitle={detailRoom?.floor}
      >
        {detailRoom && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <HotelImage
              src={TYPE_IMAGES[detailRoom.roomType] ?? HOTEL_IMAGES.rooms.Standard}
              alt=""
              className="aspect-video w-full rounded-lg"
            />
            <Badge variant={statusBadgeVariant(detailRoom.status)}>{detailRoom.statusLabel}</Badge>
            <p className="text-sm text-[var(--text-secondary)]">{detailRoom.description}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Bed</dt>
                <dd className="font-medium">{detailRoom.bedType}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Max guests</dt>
                <dd className="font-medium">{detailRoom.maxGuests}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Size</dt>
                <dd className="font-medium">{detailRoom.sizeSqm} m²</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Rate</dt>
                <dd className="font-medium">RWF {detailRoom.nightlyRateRwf.toLocaleString()}/night</dd>
              </div>
            </dl>
            <div>
              <h4 className="mb-2 text-sm font-semibold">What's included</h4>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {detailRoom.amenities.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm">
                    <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            {detailRoom.availableForDates ? (
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    onSelect(detailRoom);
                    setDetailRoom(null);
                  }}
                >
                  Choose this room — RWF {detailRoom.totalForStayRwf.toLocaleString()} total
                </Button>
                {selectedRoomNumber === detailRoom.roomNumber && onProceedToBooking && (
                  <Button className="w-full" variant="outline" onClick={onProceedToBooking}>
                    Fill booking form
                    <Icon name="ArrowRight" className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                This room cannot be booked for your dates. Pick another available room or change your dates.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}
