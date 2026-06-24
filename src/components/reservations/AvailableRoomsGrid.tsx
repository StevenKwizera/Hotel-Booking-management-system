import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { HotelImage } from "@/components/ui/HotelImage";
import { HOTEL_IMAGES } from "@/lib/hotel-images";
import type { RoomListingApi } from "@/lib/api";

const TYPE_IMAGES: Record<string, string> = {
  Standard: HOTEL_IMAGES.rooms.Standard,
  Deluxe: HOTEL_IMAGES.rooms.Deluxe,
  Suite: HOTEL_IMAGES.rooms.Suite,
};

interface AvailableRoomsGridProps {
  rooms: RoomListingApi[];
  loading: boolean;
  selectedRoomNumber: string | null;
  onSelect: (roomNumber: string) => void;
  checkIn: string;
  checkOut: string;
  nights: number;
}

export function AvailableRoomsGrid({
  rooms,
  loading,
  selectedRoomNumber,
  onSelect,
  checkIn,
  checkOut,
  nights,
}: AvailableRoomsGridProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]"
          />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--border-subtle)] py-10 text-center text-sm text-[var(--text-muted)]">
        No rooms match your filters. Try different dates or room type.
      </p>
    );
  }

  const available = rooms.filter((r) => r.availableForDates);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)]">
        {checkIn} → {checkOut} · {nights} night{nights === 1 ? "" : "s"} ·{" "}
        <span className="font-medium text-emerald-700 dark:text-emerald-400">
          {available.length} available
        </span>{" "}
        of {rooms.length} shown
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const selected = selectedRoomNumber === room.roomNumber;
          const img = TYPE_IMAGES[room.roomType] ?? HOTEL_IMAGES.rooms.Standard;
          const total = room.nightlyRateRwf * nights;
          return (
            <button
              key={room.roomNumber}
              type="button"
              disabled={!room.availableForDates}
              onClick={() => room.availableForDates && onSelect(room.roomNumber)}
              className={`overflow-hidden rounded-xl border-2 text-left transition-all ${
                !room.availableForDates
                  ? "cursor-not-allowed border-[var(--border-subtle)] opacity-60"
                  : selected
                    ? "border-sky-500 ring-2 ring-sky-500/30 shadow-md"
                    : "border-[var(--border-subtle)] hover:border-sky-400/60 hover:shadow-sm"
              }`}
            >
              <div className="relative">
                <HotelImage src={img} alt={`Room ${room.roomNumber}`} className="aspect-[16/10] w-full" />
                <div className="absolute left-2 top-2">
                  <Badge variant={room.availableForDates ? "success" : "default"}>
                    {room.statusLabel}
                  </Badge>
                </div>
                {selected && (
                  <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white">
                    <Icon name="Check" className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="space-y-1 bg-[var(--bg-surface)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--text-primary)]">Room {room.roomNumber}</p>
                  <span className="text-xs font-medium text-[var(--text-muted)]">{room.roomType}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  RWF {room.nightlyRateRwf.toLocaleString()}/night
                </p>
                {room.availableForDates && (
                  <p className="text-sm font-medium text-sky-700 dark:text-sky-300">
                    Total: RWF {total.toLocaleString()}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
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
