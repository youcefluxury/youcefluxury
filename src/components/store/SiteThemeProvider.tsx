import { useQuery } from "convex/react";
import { useEffect } from "react";

import { api } from "@/convex/_generated/api";
import {
  applySiteTheme,
  readStoredSiteMode,
  readStoredSiteTheme,
} from "@/lib/site-theme";

/**
 * Applies the site design the admin picked (dashboard → “Site design”).
 *
 * The design this browser saw last time is applied immediately, before the
 * query answers, so a reload never flashes the previous look; the database
 * value then wins, which is what makes a change visible to every visitor.
 */
export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const stored = useQuery(api.catalog.getSiteTheme);
  const saved = stored?.theme;
  const savedMode = stored?.mode;

  useEffect(() => {
    const cached = readStoredSiteTheme();
    if (cached) applySiteTheme(cached, readStoredSiteMode());
  }, []);

  useEffect(() => {
    if (saved) applySiteTheme(saved, savedMode);
  }, [saved, savedMode]);

  return <>{children}</>;
}
