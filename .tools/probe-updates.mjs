import { readFileSync } from "node:fs";

const load = (f) => readFileSync(`../_update/Done/assets/${f}`, "utf8");
const shared = load("index-C6xIWDG_.js");
const admin = load("Admin-CPyhtBuV.js");

/* ---- theme presets -------------------------------------------------- */
const presets = [];
for (const m of shared.matchAll(/\{id:"[a-zA-Z0-9_-]+",nameAr:"/g)) {
  const start = m.index ?? 0;
  const tokensAt = shared.indexOf("tokens:{", start);
  const window = shared.slice(start, tokensAt + 900);
  const end = window.indexOf("}}") + 2;
  const slice = window.slice(0, end > 1 ? end : window.length);
  const get = (re) => (window.match(re)?.[1] ?? "").replace(/\\"/g, '"');
  const tokens = {};
  for (const t of slice.matchAll(/"(--[a-zA-Z-]+)":"([^"]*)"/g)) tokens[t[1]] = t[2];
  presets.push({
    id: get(/^\{id:"([^"]+)"/),
    nameAr: get(/nameAr:"((?:[^"\\]|\\.)*)"/),
    nameEn: get(/nameEn:"((?:[^"\\]|\\.)*)"/),
    blurbAr: get(/blurbAr:"((?:[^"\\]|\\.)*)"/),
    blurbEn: get(/blurbEn:"((?:[^"\\]|\\.)*)"/),
    dark: /dark:!0/.test(shared.slice(start, tokensAt)),
    tokens,
  });
}
console.log(`PRESETS: ${presets.length}`);
for (const p of presets) {
  console.log(`\n${p.id} | ${p.nameAr} / ${p.nameEn}${p.dark ? " (DARK)" : ""}`);
  console.log(`  ${p.blurbAr}`);
  console.log(`  tokens: ${JSON.stringify(p.tokens)}`);
}

/* ---- helper: print context around a needle -------------------------- */
function ctx(label, haystack, needle, span = 320, max = 2) {
  console.log(`\n=== ${label} ===`);
  let index = -1;
  for (let i = 0; i < max; i += 1) {
    index = haystack.indexOf(needle, index + 1);
    if (index === -1) break;
    console.log(haystack.slice(Math.max(0, index - span / 2), index + span));
    console.log("---");
  }
}

ctx("r2.checkConnection usage", admin + shared, ".r2.checkConnection", 400, 1);
ctx("r2.uploadImage usage", admin + shared, ".r2.uploadImage", 500, 1);
ctx("setSiteTheme usage", admin + shared, ".catalog.setSiteTheme", 420, 1);
ctx("getSiteTheme usage", shared, ".catalog.getSiteTheme", 420, 1);
ctx("setStoreSetting usage", admin, ".catalog.setStoreSetting", 420, 1);
ctx("getStoreSettings usage", shared, ".catalog.getStoreSettings", 420, 1);
ctx("theme token keys array", shared, '"--accent-foreground","--border"', 300, 1);
