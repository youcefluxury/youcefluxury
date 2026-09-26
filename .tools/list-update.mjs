import { createExtractorFromFile } from "node-unrar-js";
import { mkdirSync } from "node:fs";

// READ-ONLY: the archive itself is never modified. Everything is written to
// ../_update so it stays fully separate from the project and from the hosted
// site that this dist belongs to.
mkdirSync("../_update", { recursive: true });

const extractor = await createExtractorFromFile({
  filepath: "../Done - Copie.rar",
  targetPath: "../_update",
});

const list = await extractor.getFileList();
const headers = [...list.fileHeaders];
console.log(`ENTRIES: ${headers.length}`);

const byDir = new Map();
for (const h of headers) {
  const parts = h.name.split("/");
  const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "(root)";
  const bucket = byDir.get(dir) ?? [];
  bucket.push(parts[parts.length - 1]);
  byDir.set(dir, bucket);
}
for (const [dir, files] of [...byDir.entries()].sort()) {
  console.log(`\n[${dir}] (${files.length})`);
  console.log("  " + files.slice(0, 60).join("\n  "));
}

const result = await extractor.extract();
console.log(`\nEXTRACTED: ${[...result.files].length}`);
