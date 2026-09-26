import { readFileSync } from "node:fs";

const load = (f) => readFileSync(`../_update/Done/assets/${f}`, "utf8");
const shared = load("index-C6xIWDG_.js");
const admin = load("Admin-CPyhtBuV.js");
const delivery = load("DeliveryPrices-BdO92l7D.js");

function ctx(label, haystack, needle, before = 60, after = 700, max = 1) {
  console.log(`\n=== ${label} ===`);
  let index = -1;
  for (let i = 0; i < max; i += 1) {
    index = haystack.indexOf(needle, index + 1);
    if (index === -1) break;
    console.log(haystack.slice(Math.max(0, index - before), index + after));
    console.log("---");
  }
}

ctx("applyTheme fn (Yp)", shared, "function Yp(", 0, 900);
ctx("localStorage key B0", shared, "B0=", 200, 120);
ctx("theme preset resolver ss()", shared, "function ss(", 0, 800);
ctx("default theme id ee", shared, "ee=", 200, 80);
ctx("preset tokens type keys", shared, "const", 0, 0);
ctx("map resolver H2", shared, "function H2(", 0, 800);
ctx("map display ge", shared, "function ge(", 0, 800);
ctx("SiteThemeProvider nA", shared, "function nA(", 0, 500);
ctx("theme export names", shared, "Yp", 0, 0);
ctx("delivery list usage", shared, "delivery.listDeliveryPrices", 500, 700, 2);
ctx("delivery set usage", admin + shared, "delivery.setDeliveryPrice", 600, 700, 1);
ctx("checkout delivery total", shared, "listDeliveryPrices", 500, 900, 3);
ctx("delivery page render start", delivery, "function", 0, 400, 1);
console.log("\n=== delivery chunk size ===", delivery.length);
console.log("\n=== delivery chunk arabic strings ===");
for (const m of delivery.matchAll(/"([^"\\]{4,120})"/g)) {
  if (/[\u0600-\u06FF]/.test(m[1])) console.log("AR:", m[1]);
}
