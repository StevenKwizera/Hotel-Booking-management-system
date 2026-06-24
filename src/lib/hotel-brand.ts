/** Inline brand mark for printable receipts (works offline / file://). */
export const HOTEL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="56" height="56" role="img" aria-label="Orkestra">
  <rect width="120" height="120" rx="28" fill="#1a4d3a"/>
  <circle cx="60" cy="60" r="42" stroke="#a8d4b8" stroke-width="2" opacity="0.5" fill="none"/>
  <path d="M36 78V42c0 0 8 10 12 10s12-10 12-10v36" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M60 42v36M72 52l12-10v36" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="60" cy="34" r="4" fill="#a8d4b8"/>
</svg>`;

export function formatReceiptDate(isoDate: string): string {
  if (!isoDate || isoDate === "—") return isoDate;
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
