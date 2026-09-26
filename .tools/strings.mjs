import fs from "node:fs";
const f = process.argv[2];
const src = fs.readFileSync(f, "utf8");
const out = new Set();
const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
let m;
while ((m = re.exec(src))) {
  const s = m[1] ?? m[2] ?? m[3];
  if (!s) continue;
  if (/[\u0600-\u06FF]/.test(s) || s.length < 200) out.add(s);
}
const arr = [...out];
fs.writeFileSync(process.argv[3], arr.join("\n"));
console.log(f, "->", arr.length, "strings");
