import fs from "node:fs";
const src = fs.readFileSync("_update/Done/assets/index-C6xIWDG_.js", "utf8");
// find objects that look like dictionaries: "key.ar": ..., "key.en": ...
const re = /"([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
let m; const map = new Map();
while ((m = re.exec(src))) {
  const k = m[1];
  let v = m[2];
  try { v = JSON.parse('"' + v + '"'); } catch {}
  if (!map.has(k)) map.set(k, v);
}
console.log("keys:", map.size);
const lines = [...map.entries()].map(([k, v]) => k + "\t" + v);
fs.writeFileSync(".tools/out/bun-dict.tsv", lines.join("\n"));
// group by prefix
const byPrefix = {};
for (const k of map.keys()) { const p = k.split(".")[0]; byPrefix[p] = (byPrefix[p]||0)+1; }
console.log(byPrefix);
