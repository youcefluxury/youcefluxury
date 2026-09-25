import { useEffect, useState } from "react";

/**
 * A slow storefront clock (one tick a minute). Time-based store rules — a card
 * marked “sold out” hides exactly 24 hours later — are then applied while a
 * customer keeps the page open, without needing a reload. The dashboard uses
 * Convex queries directly and is never affected by this.
 */
export function useStoreClock(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}
