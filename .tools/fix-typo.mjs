import fs from "node:fs";

const file = "src/lib/i18n.tsx";
let text = fs.readFileSync(file, "utf8");

// A literal backslash-u sequence slipped into the source; decode it to the
// real characters: ا ل ب "ucket".
const literal = "\\u0627\\u0644\\u0628ucket.";
if (text.split(literal).length - 1 !== 1) throw new Error("literal not unique");
text = text.replace(literal, "\u0627\u0644\u0628ucket.");

fs.writeFileSync(file, text);
console.log("WROTE", file);
