import { httpRouter } from "convex/server";

import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/* ------------------------------------------------------------------ */
/* Search engines                                                      */
/* ------------------------------------------------------------------ */

/** Where the shop lives until a custom domain replaces it. */
const DEFAULT_SITE_URL = "https://luxuryyoucef.pages.dev";

/**
 * The storefront a sitemap should point at.
 *
 * A deployment often has SITE_URL already set to its own Convex address, but a
 * sitemap listing that as the shop's home page would tell Google the store
 * lives on an API endpoint. So a Convex address is treated as "not set" and
 * the storefront default is used until a real domain is configured.
 */
const SITE_URL = (() => {
  const configured = (process.env.SITE_URL || "").trim();
  const looksLikeBackend = /\.convex\.(cloud|site)$/i.test(
    configured.replace(/\/+$/, ""),
  );
  const base = configured && !looksLikeBackend ? configured : DEFAULT_SITE_URL;
  return base.replace(/\/+$/, "");
})();

/** XML needs these escaped, or a product named `A & B` breaks the file. */
function esc(value: string): string {
  return value
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;")
    .split('"')
    .join("&quot;")
    .split("'")
    .join("&apos;");
}

/** One <url> row. `lastmod` is optional per row, hence the argument. */
function urlRow(loc: string, priority: string, lastmod?: string): string {
  const rows = ["  <url>", "    <loc>" + esc(loc) + "</loc>"];
  if (lastmod) rows.push("    <lastmod>" + lastmod + "</lastmod>");
  rows.push("    <changefreq>weekly</changefreq>");
  rows.push("    <priority>" + priority + "</priority>");
  rows.push("  </url>");
  return rows.join("\n");
}

/**
 * Every page a shopper can land on, built from the live catalogue.
 *
 * Generated per request rather than written at build time, because the
 * catalogue changes whenever the owner adds something — a static file would go
 * stale and quietly hide new products. An HTTP action has no database of its
 * own, so it asks `catalog.sitemapEntries` for the rows instead.
 */
http.route({
  path: "/sitemap.xml",
  method: "GET",
  handler: httpAction(async ({ runQuery }) => {
    const data = await runQuery(api.catalog.sitemapEntries, {});
    const today = new Date().toISOString().slice(0, 10);

    const rows: string[] = [];
    rows.push(urlRow(SITE_URL + "/", "1.0", today));
    rows.push(urlRow(SITE_URL + "/shop", "0.9", today));
    rows.push(urlRow(SITE_URL + "/delivery", "0.4"));

    for (const category of data.categories) {
      rows.push(
        urlRow(
          SITE_URL + "/category/" + encodeURIComponent(category.slug),
          "0.8",
          today,
        ),
      );
    }

    for (const product of data.products) {
      rows.push(
        urlRow(
          SITE_URL + "/product/" + encodeURIComponent(product.id),
          "0.7",
          new Date(product.createdAt).toISOString().slice(0, 10),
        ),
      );
    }

    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
      .concat(rows)
      .concat(["</urlset>", ""])
      .join("\n");

    return new Response(body, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  }),
});

/**
 * Tells crawlers what to read. The dashboard and the API are private to the
 * shop owner and have no business in a search result, so both are closed off.
 */
http.route({
  path: "/robots.txt",
  method: "GET",
  handler: httpAction(async () => {
    const body = [
      "User-agent: *",
      "Allow: /",
      "",
      "# Private to the shop owner - nothing here belongs in a search result.",
      "Disallow: /admin",
      "Disallow: /api/",
      "",
    ].join("\n");

    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  }),
});

export default http;
