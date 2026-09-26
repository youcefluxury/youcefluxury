import { readFileSync } from "node:fs";

const load = (f) => readFileSync(`../_update/Done/assets/${f}`, "utf8");
const shared = load("index-C6xIWDG_.js");
const admin = load("Admin-CPyhtBuV.js");

function ctx(label, haystack, needle, before = 0, after = 700, max = 1) {
  console.log(`\n=== ${label} ===`);
  let index = -1;
  for (let i = 0; i < max; i += 1) {
    index = haystack.indexOf(needle, index + 1);
    if (index === -1) break;
    console.log(haystack.slice(Math.max(0, index - before), index + after));
    console.log("---");
  }
}

ctx("store brand resolver Kn tail", shared, "mapEmbedUrl:", 200, 300, 1);
ctx("checkout payload tail", shared, 'paymentMethod:"cod"', 0, 1200, 1);
ctx("cart uses listDeliveryPrices fee", shared, "ae=c0(", 500, 1500, 1);
console.log("\n=== deliveryFee occurrences (shared) ===");
let i = -1;
for (let n = 0; n < 14; n += 1) {
  i = shared.indexOf("deliveryFee", i + 1);
  if (i === -1) break;
  console.log(">>", shared.slice(Math.max(0, i - 130), i + 130).replace(/\n/g, " "));
}
console.log("\n=== deliveryFee occurrences (admin) ===");
i = -1;
for (let n = 0; n < 10; n += 1) {
  i = admin.indexOf("deliveryFee", i + 1);
  if (i === -1) break;
  console.log(">>", admin.slice(Math.max(0, i - 130), i + 130).replace(/\n/g, " "));
}
console.log("\n=== admin tabs ===");
ctx("admin tab list", admin, 'tabDesign', 700, 700, 1);
console.log("\n=== sizes ===", { shared: shared.length, admin: admin.length });
