import fs from "node:fs";
const raw = fs.readFileSync("_update/Done/assets/index-C6xIWDG_.js","utf8").replace(/\\"/g,'"');
const Q = '"', BQ = String.fromCharCode(96);
const V = `(?:[^"\\\\\\n]|\\\\.)*`;
const re = new RegExp(
  `"([A-Za-z][A-Za-z0-9]*(?:\\.[A-Za-z0-9_]+)+)"\\s*:\\s*\\{\\s*ar\\s*:\\s*(?:"(${V})"|\`([^\`]*)\`)\\s*,\\s*en\\s*:\\s*(?:"(${V})"|\`([^\`]*)\`)\\s*,?\\s*\\}`,
  "g"
);
let m; const map = new Map();
const un = (s)=>{ try { return JSON.parse('"'+s.replace(/\\`/g,'`')+'"'); } catch { return s; } };
while ((m = re.exec(raw))) map.set(m[1], { ar: un(m[3] ?? m[2]), en: un(m[5] ?? m[4]) });
console.log("rar keys:", map.size);
const byPrefix = {}; for (const k of map.keys()) { const p=k.split(".")[0]; byPrefix[p]=(byPrefix[p]||0)+1; }
console.log(byPrefix);
fs.writeFileSync(".tools/out/bun-i18n.json", JSON.stringify(Object.fromEntries(map), null, 1));
