import { readFileSync, writeFileSync } from "node:fs";

const edits = [
  ["src/components/store/SiteDesignTab.tsx", [
    ['brand.logo === "/brand.svg" ? "" : brand.logo', 'brand.logo === "/logo.png" ? "" : brand.logo'],
  ]],
  ["src/components/store/AdminEdit.tsx", [
    ['value === "/brand.svg" ? "" : value', 'value === "/logo.png" ? "" : value'],
  ]],
  ["src/hooks/use-store-brand.ts", [
    ['logo: logo.length > 0 ? logo : "/brand.svg",', 'logo: logo.length > 0 ? logo : "/logo.png",'],
  ]],
  ["src/components/store/StoreMeta.tsx", [
    ['const href = url.trim() ? url.trim() : "/brand.svg";', 'const href = url.trim() ? url.trim() : "/logo.png";'],
  ]],
  ["index.html", [
    ['<link rel="icon" type="image/svg+xml" href="/brand.svg" />', '<link rel="icon" type="image/png" href="/logo.png" />'],
    ['<img id="boot-logo" src="/brand.svg" alt="" />', '<img id="boot-logo" src="/logo.png" alt="" />'],
  ]],
];

for (const [file, pairs] of edits) {
  let text = readFileSync(file, "utf8");
  for (const [from, to] of pairs) {
    if (!text.includes(from)) {
      console.error(`MISS ${file}: ${from}`);
      process.exit(1);
    }
    text = text.split(from).join(to);
  }
  writeFileSync(file, text);
  console.log(`OK: ${file}`);
}
