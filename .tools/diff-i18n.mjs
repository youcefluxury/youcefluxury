import { readFileSync, writeFileSync } from "node:fs";

/* Extract every i18n entry from the update build and from the current source,
   then report keys whose text changed (the port must follow the update). */
const entryRe =
  /"([a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z0-9]+)":\s*\{\s*(?:"ar"|ar):\s*"((?:[^"\\]|\\.)*)",\s*(?:"en"|en):\s*"((?:[^"\\]|\\.)*)",?\s*\}/g;

const found = new Map();
for (const file of [
  "index-C6xIWDG_.js",
  "Admin-CPyhtBuV.js",
  "DeliveryPrices-BdO92l7D.js",
]) {
  // The build is minified: `"key":{ar:"…",en:"…"}` (no spaces).
  const src = readFileSync(`../_update/Done/assets/${file}`, "utf8");
  for (const m of src.matchAll(entryRe)) {
    if (!found.has(m[1])) found.set(m[1], { ar: m[2], en: m[3] });
  }
}

const current = readFileSync("../src/lib/i18n.tsx", "utf8");
const currentMap = new Map();
for (const m of current.matchAll(entryRe)) {
  if (!currentMap.has(m[1])) currentMap.set(m[1], { ar: m[2], en: m[3] });
}

const changed = [];
const missing = [];
for (const [key, value] of found) {
  const old = currentMap.get(key);
  if (!old) {
    missing.push(key);
    continue;
  }
  if (old.ar !== value.ar || old.en !== value.en) {
    changed.push({ key, old, new: value });
  }
}

/* Keys the current source has but the update dropped. */
const dropped = [...currentMap.keys()].filter((key) => !found.has(key));

writeFileSync(
  "out/i18n-changes.json",
  JSON.stringify({ changed, missing, dropped }, null, 2),
);

console.log(`update entries: ${found.size} | current entries: ${currentMap.size}`);
console.log(`\n=== CHANGED (${changed.length}) ===`);
for (const { key, old, new: next } of changed) {
  console.log(`${key}\n  old ar: ${old.ar}\n  new ar: ${next.ar}\n  old en: ${old.en}\n  new en: ${next.en}`);
}
console.log(`\n=== MISSING in current (${missing.length}) ===`);
console.log(missing.join(", "));
console.log(`\n=== DROPPED by update (${dropped.length}) ===`);
console.log(dropped.join(", "));
