import fs from "node:fs";
const src = fs.readFileSync("_update/Done/assets/index-C6xIWDG_.js", "utf8");
// normalize escaped quotes
const norm = src.replace(/\\"/g, '"');
const re = /"([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)+)"\s*:\s*\{\s*ar\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*en\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
let m; const map = new Map();
while ((m = re.exec(norm))) {
  const un = (s) => { try { return JSON.parse('"'+s+'"'); } catch { return s; } };
  if (!map.has(m[1])) map.set(m[1], { ar: un(m[2]), en: un(m[3]) });
}
console.log("keys:", map.size);
const byPrefix = {};
for (const k of map.keys()) { const p = k.split(".")[0]; byPrefix[p]=(byPrefix[p]||0)+1; }
console.log(byPrefix);
fs.writeFileSync(".tools/out/bun-i18n.json", JSON.stringify(Object.fromEntries(map), null, 1));
