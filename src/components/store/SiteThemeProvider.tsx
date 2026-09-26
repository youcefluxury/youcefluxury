import { useQuery } from "convex/react";
import { useEffect } from "react";

import { api } from "@/convex/_generated/api";
import { applySiteTheme, readStoredSiteTheme } from "@/lib/site-theme";

/**
 * Applies the site design the admin picked (dashboard → “Site design”).
 *
 * The design this browser saw last time is applied immediately, before the
 * query answers, so a reload never flashes the previous look; the database
 * value then wins, which is what makes a change visible to every visitor.
 */
export function SiteThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const saved = useQuery(api.catalog.getSiteTheme)?.theme;

  useEffect(() => {
    const cached = readStoredSiteTheme();
    if (cached) applySiteTheme(cached);
  }, []);

  useEffect(() => {
    if (saved) applySiteTheme(saved);
  }, [saved]);

  return <>{children}</>;
}
