// Adds the shared map-coordinates placeholder, then points AdminEdit at it.
import fs from "node:fs";

const once = (text, needle) => {
  if (text.split(needle).length - 1 !== 1) {
    throw new Error("anchor not unique: " + JSON.stringify(needle.slice(0, 60)));
  }
};

// 1. store-data.ts — the shared placeholder.
{
  const file = "src/lib/store-data.ts";
  let text = fs.readFileSync(file, "utf8");
  const anchor =
    "/** Valid latitude/longitude pair — anything else is refused, not embedded. */";
  once(text, anchor);
  const block = [
    "/**",
    " * Sample shown in the map field: degrees / minutes / seconds, the way a",
    " * person reads a location off their phone.",
    " */",
    "export const MAP_COORDINATES_PLACEHOLDER = `35\\u00b022'02.7\"N 1\\u00b019'24.0\"E`;",
    "",
  ].join("\n");
  text = text.replace(anchor, block + anchor);
  fs.writeFileSync(file, text);
  console.log("WROTE", file);
}

// 2. AdminEdit.tsx — use the shared constant instead of a local copy.
{
  const file = "src/components/store/AdminEdit.tsx";
  let text = fs.readFileSync(file, "utf8");

  const localDecl =
    '/** Sample shown in the map field: degrees / minutes / seconds, like a human. */\n' +
    "const MAP_PLACEHOLDER = `35\\u00b022'02.7\"N 1\\u00b019'24.0\"E`;\n\n";
  once(text, localDecl);
  text = text.replace(localDecl, "");

  const oldImport =
    'import { mapCoordinates, parseCoordinates } from "@/lib/store-data";';
  once(text, oldImport);
  text = text.replace(
    oldImport,
    'import {\n' +
      "  MAP_COORDINATES_PLACEHOLDER,\n" +
      "  mapCoordinates,\n" +
      "  parseCoordinates,\n" +
      '} from "@/lib/store-data";',
  );

  once(text, "placeholder={MAP_PLACEHOLDER}");
  text = text.replace(
    "placeholder={MAP_PLACEHOLDER}",
    "placeholder={MAP_COORDINATES_PLACEHOLDER}",
  );

  fs.writeFileSync(file, text);
  console.log("WROTE", file);
}
