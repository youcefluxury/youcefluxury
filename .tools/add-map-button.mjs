// Inserts the admin-only MapEditButton (the pencil beside the shop map).
import fs from "node:fs";

const file = "src/components/store/AdminEdit.tsx";
let text = fs.readFileSync(file, "utf8");

const once = (needle) => {
  if (text.split(needle).length - 1 !== 1) {
    throw new Error("anchor not unique: " + JSON.stringify(needle.slice(0, 60)));
  }
};

// 1. Import the two coordinate helpers.
const importAnchor = 'import { useI18n, type TKey } from "@/lib/i18n";\n';
once(importAnchor);
text = text.replace(
  importAnchor,
  importAnchor +
    'import { mapCoordinates, parseCoordinates } from "@/lib/store-data";\n',
);

// 2. The component itself, just above the Category block.
const blockAnchor =
  "/* ------------------------------------------------------------------ */\n/* Category                                                            */";
once(blockAnchor);

const component = `/* ------------------------------------------------------------------ */
/* Map — coordinates only, never a link                                */
/* ------------------------------------------------------------------ */

/** Sample shown in the map field: degrees / minutes / seconds, like a human. */
const MAP_PLACEHOLDER = \`35\\u00b022'02.7"N 1\\u00b019'24.0"E\`;

/**
 * The pencil that sits beside the shop map on the home page. It takes the
 * coordinates and nothing else, stores them as "lat,lng", and the map
 * rebuilds its own embed URL from them.
 */
export function MapEditButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const { mapEmbedUrl } = useStoreBrand();
  const setSetting = useMutation(api.catalog.setStoreSetting);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  // Show what is live now, already reduced to a plain "lat,lng" line.
  useEffect(() => {
    if (open) setValue(mapCoordinates(mapEmbedUrl));
  }, [open, mapEmbedUrl]);

  async function save() {
    const point = parseCoordinates(value);
    if (!point) {
      toast.error(t("admin.mapInvalid"));
      return;
    }
    setBusy(true);
    try {
      await setSetting({
        adminKey: ADMIN_API_KEY,
        key: "map",
        value: \`\${point.lat},\${point.lng}\`,
      });
      toast.success(t("admin.settingsSaved"));
      setOpen(false);
    } catch {
      toast.error(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminPencil
        label={t("admin.editMap")}
        onClick={() => setOpen(true)}
        className={className}
      />
      <AdminDialogShell
        open={open}
        onOpenChange={setOpen}
        title={t("admin.editMap")}
      >
        <div className="grid gap-2">
          <Label htmlFor="storeMap">{t("admin.mapCoordinates")}</Label>
          <Input
            id="storeMap"
            dir="ltr"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={MAP_PLACEHOLDER}
          />
          <p className="text-muted-foreground text-[10px] leading-4">
            {t("admin.mapCoordinatesHint")}
          </p>
        </div>
        <Button
          type="button"
          className="h-11 w-full"
          disabled={busy}
          onClick={() => void save()}
        >
          {t("admin.saveChanges")}
        </Button>
      </AdminDialogShell>
    </>
  );
}

`;

text = text.replace(blockAnchor, component + blockAnchor);
fs.writeFileSync(file, text);
console.log("WROTE", file);
