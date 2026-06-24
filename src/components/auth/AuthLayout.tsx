import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { HotelImage } from "@/components/ui/HotelImage";
import { Logo } from "@/components/brand/Logo";
import { HOTEL_IMAGES } from "@/lib/hotel-images";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  image?: string;
  imageAlt?: string;
  children: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  image = HOTEL_IMAGES.lobby,
  imageAlt = "Net Luna Villa Hotel interior",
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-app)]">
      <div className="relative hidden w-1/2 lg:block">
        <HotelImage src={image} alt={imageAlt} className="h-full min-h-screen" overlay />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/orkestra-icon.svg" alt="Orkestra" className="h-12 w-12 rounded-xl" />
            <div>
              <span className="font-display text-2xl font-semibold text-white">Orkestra</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.2em] text-white/70">
                Hospitality
              </span>
            </div>
          </Link>
          <div className="text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Net Luna Villa · Kigali</p>
            <p className="mt-4 font-display text-3xl font-semibold leading-snug">
              Luxury stays, seamless booking
            </p>
            <p className="mt-2 max-w-md text-sm text-white/85">
              Manage reservations, check-in, payments, and guest services with Orkestra.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col lg:w-1/2">
        <header className="border-b border-[var(--border-subtle)] bg-white px-6 py-4 lg:hidden">
          <Link to="/" className="inline-flex items-center gap-3">
            <Logo size={40} showWordmark />
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
          <div className="w-full max-w-md">
            <h1 className="font-display text-2xl font-semibold text-[var(--accent)]">{title}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
