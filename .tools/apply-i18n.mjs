// Adds the two map-coordinate i18n keys straight from the rar's dictionary,
// so the Arabic/English text is byte-identical to the dist.
import fs from "node:fs";

const dict = JSON.parse(fs.readFileSync(".tools/out/bun-i18n.json", "utf8"));
const file = "src/lib/i18n.tsx";
let text = fs.readFileSync(file, "utf8");

const anchor = `  "admin.mapInvalid": {`;
if (text.split(anchor).length - 1 !== 1) throw new Error("anchor not unique");

const entry = (key) =>
  `  "${key}": {\n    ar: \`${dict[key].ar}\`,\n    en: \`${dict[key].en}\`,\n  },\n`;

text = text.replace(
  anchor,
  entry("admin.mapCoordinatesHint") + entry("admin.mapHint") + anchor,
);

// "البكت." -> "البbucket." : \u0627\u0644\u0628\u0643\u062e is the broken word
const typoRe = "\\u0627\\u0644\\u0628\\u0643\\u062a\\.";
if ((text.match(new RegExp(typoRe, "g")) || []).length !== 1)
  throw new Error("typo pattern not unique");
text = text.replace(
  new RegExp(typoRe, "g"),
  () => "\\u0627\\u0644\\u0628ucket.",
);

fs.writeFileSync(file, text);
console.log("WROTE", file);
