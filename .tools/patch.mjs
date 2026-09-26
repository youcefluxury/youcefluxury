// Exact-match patcher: every replacement must match exactly once or nothing is written.
import fs from "node:fs";

const file = process.argv[2];
const spec = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
let text = fs.readFileSync(file, "utf8");
const original = text;

for (const [i, r] of spec.entries()) {
  const count = text.split(r.old).length - 1;
  if (count !== 1) {
    console.error(`ABORT ${file} #${i + 1}: matched ${count} times (expected 1)`);
    process.exit(1);
  }
  text = text.replace(r.old, () => r.new);
  console.log(`  ok #${i + 1}`);
}

if (text === original) {
  console.error(`ABORT ${file}: no change`);
  process.exit(1);
}
fs.writeFileSync(file, text);
console.log(`WROTE ${file}`);
