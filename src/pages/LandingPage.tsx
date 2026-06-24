import { Link } from "react-router-dom";
import { LandingVideoBackground } from "@/components/landing/LandingVideoBackground";
import { Icon } from "@/components/ui/Icon";
import { HOTEL_IMAGES } from "@/lib/hotel-images";

const ROOM_RATES = [
  { type: "Standard", rate: "100" },
  { type: "Deluxe", rate: "170", highlight: true },
  { type: "Suite", rate: "200" },
];

export function LandingPage() {
  return (
    <div className="relative flex h-dvh min-h-[560px] flex-col overflow-hidden text-white">
      <LandingVideoBackground src={HOTEL_IMAGES.landingVideo} />

      <div
        className="absolute inset-0 bg-gradient-to-b from-[var(--sidebar-bg)]/75 via-[var(--sidebar-bg)]/55 to-[var(--sidebar-bg)]/88"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,oklch(0.4_0.1_155/0.35),transparent_55%)]"
        aria-hidden
      />

      {/* Header — logo only + one subtle sign-in */}
      <header className="relative z-10 shrink-0 px-5 pt-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md transition hover:bg-white/10"
          >
            <img
              src="/orkestra-icon.svg"
              alt=""
              className="h-8 w-8 rounded-lg"
            />
            <div className="leading-none">
              <span className="font-display text-lg font-semibold tracking-wide">
                Orkestra
              </span>
              <span className="mt-0.5 block text-[9px] uppercase tracking-[0.22em] text-white/50">
                Net Luna Villa
              </span>
            </div>
          </Link>

          <Link
            to="/login"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-white/35 hover:bg-white/12 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-4 sm:px-8">
        <div className="landing-reveal w-full max-w-lg">
          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 shadow-[0_24px_80px_oklch(0_0_0/0.35)] backdrop-blur-xl sm:p-10">
            <div className="flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.72_0.15_155)]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Kigali, Rwanda
              </p>
            </div>

            <h1 className="mt-5 text-center font-display text-[2.35rem] font-semibold leading-[1.08] sm:text-5xl">
              Welcome to
              <span className="mt-1 block italic text-[var(--accent-light)]">
                Net Luna Villa
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-white/75 sm:text-[15px]">
              Luxury stays in the heart of the city. Reserve your room in minutes.
            </p>

            {/* Single primary action */}
            <div className="mt-8">
              <Link
                to="/register"
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--accent)] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition hover:bg-[var(--accent-hover)] active:scale-[0.99]"
              >
                <Icon name="CalendarPlus" className="h-5 w-5 transition group-hover:scale-110" />
                Book your stay
              </Link>
              <p className="mt-4 text-center text-xs text-white/50">
                Hotel staff?{" "}
                <Link
                  to="/login"
                  className="font-medium text-white/80 underline decoration-white/30 underline-offset-2 transition hover:text-white hover:decoration-white/60"
                >
                  Sign in to dashboard
                </Link>
              </p>
            </div>

            {/* Rates — display only, no extra register links */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                From per night
              </p>
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {ROOM_RATES.map((room) => (
                  <li
                    key={room.type}
                    className={`rounded-xl px-2 py-3 text-center ${
                      room.highlight
                        ? "border border-[var(--accent)]/40 bg-[var(--accent)]/15"
                        : "bg-white/5"
                    }`}
                  >
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-white/55">
                      {room.type}
                    </span>
                    <span className="mt-1 block font-display text-lg font-semibold leading-none tabular-nums">
                      {room.rate}
                    </span>
                    <span className="mt-0.5 block text-[9px] text-white/40">RWF</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer — copyright only */}
      <footer className="relative z-10 shrink-0 px-5 pb-5 text-center sm:px-8">
        <p className="text-[11px] text-white/40">
          © 2026 Orkestra Hospitality · Net Luna Villa Hotel
        </p>
      </footer>
    </div>
  );
}
