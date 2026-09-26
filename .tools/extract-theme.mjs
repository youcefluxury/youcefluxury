import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("../_update/Done/assets/index-C6xIWDG_.js", "utf8");

const presetRe =
  /\{id:"([a-zA-Z0-9_-]+)",nameAr:"((?:[^"\\]|\\.)*)",nameEn:"((?:[^"\\]|\\.)*)",blurbAr:"((?:[^"\\]|\\.)*)",blurbEn:"((?:[^"\\]|\\.)*)",(dark:!0,)?tokens:\{([^}]*)\}\}/g;

const presets = [];
for (const m of src.matchAll(presetRe)) {
  const tokens = {};
  for (const t of m[6].matchAll(/"(--[a-zA-Z-]+)":"([^"]*)"/g)) tokens[t[1]] = t[2];
  presets.push({
    id: m[1],
    nameAr: m[2],
    nameEn: m[3],
    blurbAr: m[4],
    blurbEn: m[5],
    dark: Boolean(m[6]),
    tokens,
  });
}

writeFileSync("out/theme-presets.json", JSON.stringify(presets, null, 2));
console.log(`presets found: ${presets.length}\n`);
for (const p of presets) {
  console.log(`${p.id}  |  ${p.nameAr}  /  ${p.nameEn}  ${p.dark ? "(dark)" : ""}`);
  console.log(`   ${JSON.stringify(p.tokens)}`);
}
