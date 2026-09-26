import { useEffect } from "react";

import { useStoreBrand } from "@/hooks/use-store-brand";
import { useI18n } from "@/lib/i18n";
import { cacheBrand } from "@/lib/store-brand";

/** Mime type of the current logo, so the tab icon keeps rendering. */
function faviconType(url: string): string {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".ico")) return "image/x-icon";
  return "image/svg+xml";
}

/** Points every `<link rel="icon">` at the logo the admin saved. */
function setFavicon(url: string): void {
  if (typeof document === "undefined") return;
  const href = url.trim() ? url.trim() : "/brand.svg";
  const type = faviconType(href);
  const links = Array.from(document.querySelectorAll('link[rel="icon"]'));
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = href;
    link.type = type;
    document.head.appendChild(link);
    return;
  }
  for (const link of links) {
    link.setAttribute("href", href);
    link.setAttribute("type", type);
  }
}

/**
 * Renders nothing: it follows the live store identity so the browser tab
 * title, the tab icon, the shared-site description and the loading screen all
 * show what the dashboard saved, in the active language.
 */
export function StoreMeta() {
  const { t, lang } = useI18n();
  const { logo, name, tagline, description } = useStoreBrand();

  useEffect(() => {
    setFavicon(logo);
    // Read by index.html before the bundle even loads.
    cacheBrand({ name, tagline, logo });
    document.title = t("meta.title", { store: name });
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
  }, [logo, name, tagline, description, t, lang]);

  return null;
}
