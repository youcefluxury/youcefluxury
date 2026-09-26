import { readFileSync } from "node:fs";

const load = (f) => readFileSync(`../_update/Done/assets/${f}`, "utf8");
const shared = load("index-C6xIWDG_.js");
const delivery = load("DeliveryPrices-BdO92l7D.js");

function ctx(label, haystack, needle, before = 0, after = 900, max = 1) {
  console.log(`\n=== ${label} ===`);
  let index = -1;
  for (let i = 0; i < max; i += 1) {
    index = haystack.indexOf(needle, index + 1);
    if (index === -1) break;
    console.log(haystack.slice(Math.max(0, index - before), index + after));
    console.log("---");
  }
}

console.log("########## DELIVERY CHUNK (full) ##########");
console.log(delivery);

console.log("\n########## HELPERS ##########");
ctx("K2 delivery fee resolver", shared, "function K2(", 0, 700);
ctx("c0 price lookup", shared, "function c0(", 0, 500);
ctx("o0 coordinates parser", shared, "function o0(", 0, 700);
ctx("imports of DeliveryPrices page", delivery, 'from"', 0, 60, 40);
