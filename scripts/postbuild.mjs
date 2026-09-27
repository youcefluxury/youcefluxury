import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Makes the built site work on Cloudflare Pages without a `_redirects` file.
 *
 * The usual SPA fix is one line — `/* /index.html 200` — but wrangler rejects
 * it: the rule matches every path, the destination normalises back to a path
 * that matches again, and Cloudflare calls it an infinite loop. It refuses the
 * whole upload.
 *
 * So no rule at all. Cloudflare already serves `shop/index.html` for `/shop`
 * and `category/tshirts/index.html` for `/category/tshirts` on its own, so we
 * simply give it a real file for each route the app can be opened at. Anything
 * we cannot know ahead of time — a product page, whose id only exists once the
 * owner creates the product — falls through to `404.html`, which is the app
 * itself, so React Router takes over and the URL still resolves.
 */
const dist = "dist";
const index = join(dist, "index.html");

if (!existsSync(index)) {
  console.error("MISS: dist/index.html — run the build first");
  process.exit(1);
}

// The rule that started all this. It must never be shipped.
const redirects = join(dist, "_redirects");
if (existsSync(redirects)) {
  rmSync(redirects);
  console.log("removed dist/_redirects");
}

const html = readFileSync(index, "utf8");

/** Writes the app shell at `route`, the way Pages expects to find it. */
function emit(route) {
  const target = join(dist, route, "index.html");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
}

// Every static route in src/main.tsx that has no file of its own yet.
for (const route of ["shop", "admin", "delivery"]) emit(route);

// Category pages exist per slug, so each one gets its own file too. Slugs that
// are added later still resolve through the 404 fallback below.
const slugsFile = join("scripts", "category-slugs.json");
const slugs = existsSync(slugsFile)
  ? JSON.parse(readFileSync(slugsFile, "utf8"))
  : [];
for (const slug of slugs) {
  if (/^[a-z0-9-]+$/i.test(slug)) emit(join("category", slug));
}

// The catch-all: Cloudflare serves this for any path it has no file for.
cpSync(index, join(dist, "404.html"));

console.log(
  `emitted ${slugs.length} category page(s) + shop, admin, delivery, 404.html`,
);
