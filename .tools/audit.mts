import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api";

const SITE = "https://luxuryyoucef.pages.dev";
const c = new ConvexHttpClient("https://hallowed-lynx-927.eu-west-1.convex.cloud");
const kb = (n: number) => (n / 1024).toFixed(0);

// ---------------------------------------------------- 1. static assets on the site
const html = await (await fetch(`${SITE}/`)).text();
const refs = [
  ...new Set([
    ...[...html.matchAll(/\/assets\/[A-Za-z0-9._-]+/g)].map((m) => m[0]),
    ...[...html.matchAll(/\/(products|sliders)\/[A-Za-z0-9._-]+/g)].map((m) => m[0]),
  ]),
];

console.log("=== 1. static assets shipped with the site ===");
let htmlBytes = 0;
for (const r of ["/", ...refs]) {
  const res = await fetch(`${SITE}${r}`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (r === "/") htmlBytes = len;
  console.log(`  ${kb(len).padStart(5)} KB  ${r}`);
}

// ---------------------------------------------------- 2. the real homepage weight
const firstPaint = ["index-DOfmh3TY.js", "index-DgsMm2eR.css", "react-vendor", "Landing"];
console.log("\n=== 2. what one visitor downloads for the home page ===");
const home = [
  "/",
  ...refs.filter((r) => r.includes("index-") || r.includes("react-vendor") || r.includes("radix-ui")),
  ...refs.filter((r) => r.includes("framer-motion") || r.includes("use-store-clock") || r.includes("Landing")),
  ...refs.filter((r) => r.startsWith("/sliders/")),
];
let total = 0;
for (const r of [...new Set(home)]) {
  const len = Number((await fetch(`${SITE}${r}`)).headers.get("content-length") ?? 0);
  total += len;
}
console.log(`  ${kb(total)} KB  (${((total / 1048576) * 100).toFixed(1)}% of the 1 GB monthly free tier)`);

// ---------------------------------------------------- 3. images actually stored
const { session } = await c.mutation(api.admin.login, { username: "admin", password: "123456" });
const products = (await c.query(api.catalog.listProducts, {})) as { nameAr: string; images: string[] }[];
const settings = (await c.query(api.catalog.getStoreSettings, {})) as { logo?: string };
const stored = [
  ...products.flatMap((p) => p.images.map((u) => ({ who: `منتج: ${p.nameAr}`, url: u }))),
  ...(settings.logo ? [{ who: "الشعار", url: settings.logo }] : []),
];

console.log("\n=== 3. images stored in the database ===");
let storedBytes = 0;
for (const { who, url } of stored) {
  const res = await fetch(url);
  const len = Number(res.headers.get("content-length") ?? 0);
  storedBytes += len;
  const where = url.includes("convex.cloud") ? "Convex storage" : "خارجي";
  console.log(`  ${kb(len).padStart(5)} KB  ${who}  (${where})`);
  console.log(`           ${url.slice(0, 78)}`);
}
console.log(`  ----`);
console.log(`  ${kb(storedBytes).padStart(5)} KB  إجمالي المخزَّن حالياً`);
