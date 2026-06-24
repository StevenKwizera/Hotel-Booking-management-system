import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll to hash anchor after navigation (e.g. /dashboard#kpis). */
export function useHashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, [location.pathname, location.hash]);
}
