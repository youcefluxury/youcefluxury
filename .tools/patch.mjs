// Exact-match patcher. Each entry is { old, new } or { re, new }.
// Plain "old" must occur exactly once; "re" must match exactly once.
import fs from "node:fs";

const file = process.argv[2];
const spec = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
let text = fs.readFileSync(file, "utf8");

for (const [i, r] of spec.entries()) {
  let count;
  if (r.re !== undefined) {
    const g = new RegExp(r.re, "g");
    count = (text.match(g) || []).length;
    if (count !== 1) {
      console.error(`ABORT ${file} #${i + 1}: regex matched ${count} times (expected 1)`);
      process.exit(1);
    }
    text = text.replace(new RegExp(r.re, "g"), () => r.new);
  } else {
    count = text.split(r.old).length - 1;
    if (count !== 1) {
      console.error(`ABORT ${file} #${i + 1}: matched ${count} times (expected 1)`);
      process.exit(1);
    }
    text = text.replace(r.old, () => r.new);
  }
  console.log(`ok  ${file} #${i + 1}`);
}

fs.writeFileSync(file, text);
console.log(`WROTE ${file} (${text.length} bytes)`);
