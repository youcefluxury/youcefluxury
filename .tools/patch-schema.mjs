import { readFileSync, writeFileSync } from "node:fs";

const path = "src/convex/schema.ts";
let text = readFileSync(path, "utf8");

const anchor = "    meta: defineTable({";
if (!text.includes(anchor)) {
  console.error("MISS: meta table anchor");
  process.exit(1);
}

const addition = `    /**
     * Signed-in operator sessions. \`admin:login\` issues the token only after
     * the username + password check, and it is the single credential the
     * dashboard sends with every admin call — a random value cannot be read
     * out of the browser bundle the way a hardcoded key could.
     */
    adminSessions: defineTable({
      token: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
    }).index("by_token", ["token"]),

`;

text = text.replace(anchor, addition + anchor);
writeFileSync(path, text);
console.log("OK:", path);
