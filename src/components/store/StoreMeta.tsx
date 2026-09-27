import { useEffect } from "react";
import { useLocation } from "react-router";

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
/**
 * Sets a <meta> by name or property, creating it the first time.
 *
 * The app ships a single index.html and fills the page in afterwards, so
 * anything a crawler or a social preview needs has to be written from here.
 */
function upsertMeta(
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** One canonical URL per page, so nothing is indexed twice under two addresses. */
function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function StoreMeta() {
  const { t, lang } = useI18n();
  const { logo, name, tagline, description } = useStoreBrand();
  const { pathname } = useLocation();

  useEffect(() => {
    setFavicon(logo);
    // Read by index.html before the bundle even loads.
    cacheBrand({ name, tagline, logo });
    document.title = t("meta.title", { store: name });
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);

    const title = t("meta.title", { store: name });
    const origin = window.location.origin;
    const canonical = origin + pathname;

    document.documentElement.lang = lang;
    upsertCanonical(canonical);

    // /admin is the owner's private workspace, never a search result.
    const isPrivate = pathname.startsWith("/admin");
    upsertMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      isPrivate ? "noindex, nofollow" : "index, follow",
    );

    // What WhatsApp, Facebook and X show when a shop link is shared.
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonical);
    upsertMeta(
      'meta[property="og:site_name"]',
      "property",
      "og:site_name",
      name,
    );
    upsertMeta(
      'meta[property="og:locale"]',
      "property",
      "og:locale",
      lang === "ar" ? "ar_DZ" : "en_US",
    );
    if (logo) {
      const image = origin + logo;
      upsertMeta('meta[property="og:image"]', "property", "og:image", image);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }

    upsertMeta(
      'meta[name="twitter:card"]',
      "name",
      "twitter:card",
      "summary_large_image",
    );
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description,
    );
  }, [logo, name, tagline, description, t, lang, pathname]);

  return null;
}
