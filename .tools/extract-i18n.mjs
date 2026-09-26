import { readFileSync, writeFileSync } from "node:fs";

// The updated build's chunks (read-only). Nothing here modifies the archive.
const chunks = [
  "index-C6xIWDG_.js",
  "Admin-CPyhtBuV.js",
  "DeliveryPrices-BdO92l7D.js",
  "Landing-D5te9-xl.js",
  "ProductDetails-CS7z7kv1.js",
  "Shop-gcp".replace("gcp", "gC") + "pdkzkd.js",
  "CategoryPage-efMVJcM_.js",
  "NotFound-BiwKDkg7.js",
  "use-store-clock-CzwnYHtz.js",
  "image-CqThCt_5.js",
];

const entryRe =
  /"([a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z0-9]+)":\{ar:"((?:[^"\\]|\\.)*)",en:"((?:[^"\\]|\\.)*)"\}/g;

const found = new Map();
for (const file of chunks) {
  let src;
  try {
    src = readFileSync(`../_update/Done/assets/${file}`, "utf8");
  } catch {
    continue;
  }
  for (const m of src.matchAll(entryRe)) {
    if (!found.has(m[1])) found.set(m[1], { ar: m[2], en: m[3] });
  }
}

const current = readFileSync("../src/lib/i18n.tsx", "utf8");
const currentKeys = new Set(
  [...current.matchAll(/"([a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z0-9]+)":\s*\{/g)].map((m) => m[1]),
);

const onlyNew = [...found.entries()]
  .filter(([key]) => !currentKeys.has(key))
  .sort((a, b) => a[0].localeCompare(b[0]));

writeFileSync(
  "out/new-i18n.json",
  JSON.stringify(Object.fromEntries(onlyNew), null, 2),
);

console.log(`extracted entries: ${found.size} | new vs current source: ${onlyNew.length}\n`);
for (const [key, value] of onlyNew) {
  console.log(`${key}\n  ar: ${value.ar}\n  en: ${value.en}`);
}
