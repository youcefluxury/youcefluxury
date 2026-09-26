import { useAction, useMutation, useQuery } from "convex/react";
import {
  Check,
  HardDrive,
  Image as ImageIcon,
  MapPin,
  Palette,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { ProductImage } from "@/components/store/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStoreBrand } from "@/hooks/use-store-brand";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { pickLang, useI18n } from "@/lib/i18n";
import {
  SITE_THEMES,
  applySiteTheme,
  siteThemeById,
  type SiteThemePreset,
} from "@/lib/site-theme";
import { STORE, mapCoordinates, toMapEmbedUrl } from "@/lib/store-data";
import { useUploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Site design — the look of the whole storefront                      */
/* ------------------------------------------------------------------ */

/** Swatch colours of the built-in design (see src/index.css). */
const ORIGINAL_SWATCHES = {
  ink: "#0a0a0a",
  paper: "#fafafa",
  brand: "#b08d57",
};

/** Three dots that show a design before it is applied. */
function ThemeSwatches({ preset }: { preset: SiteThemePreset }) {
  const swatches = [
    preset.tokens["--ink"] ?? ORIGINAL_SWATCHES.ink,
    preset.tokens["--paper"] ?? ORIGINAL_SWATCHES.paper,
    preset.tokens["--brand"] ?? ORIGINAL_SWATCHES.brand,
  ];
  return (
    <div className="flex items-center gap-1.5">
      {swatches.map((color, index) => (
        <span
          key={`${preset.id}-${index}`}
          className="size-4 rounded-full border border-border/70"
          style={{ background: color }}
        />
      ))}
    </div>
  );
}

/**
 * Design picker: every card applies itself to the whole store on tap, and the
 * result shows up here immediately — before any shopper sees it.
 */
function SiteDesignPanel() {
  const { t, lang } = useI18n();
  const saved = useQuery(api.catalog.getSiteTheme)?.theme;
  const setSiteTheme = useMutation(api.catalog.setSiteTheme);
  const [pending, setPending] = useState<string | null>(null);

  const current = saved ?? "original";
  const applied = siteThemeById(current);

  async function apply(id: SiteThemePreset["id"]) {
    if (id === current || pending) return;
    setPending(id);
    // Instant preview: the store restyles before the write comes back.
    applySiteTheme(id);
    try {
      await setSiteTheme({ adminKey: ADMIN_API_KEY, theme: id as never });
      toast.success(t("admin.designSaved"));
    } catch {
      applySiteTheme(current);
      toast.error(t("admin.designFailed"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-background p-5">
      <div className="flex items-start gap-3">
        <Palette className="size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {t("admin.designCurrent")}:{" "}
            {pickLang(applied.nameAr, applied.nameEn, lang)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {t("admin.designLead")}
          </p>
          <p className="text-muted-foreground mt-2 text-[10px] leading-5">
            {t("admin.designHint")}
          </p>
        </div>
      </div>

      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SITE_THEMES.map((preset) => {
          const isCurrent = preset.id === current;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={pending !== null}
              onClick={() => void apply(preset.id)}
              className={cn(
                "grid gap-3 rounded-xl border p-4 text-start transition-colors",
                isCurrent
                  ? "border-foreground bg-muted/40"
                  : "border-border/70 hover:border-foreground/40",
                pending === preset.id && "opacity-60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <ThemeSwatches preset={preset} />
                {isCurrent ? (
                  <span className="bg-foreground text-background inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium">
                    <Check className="size-3" />
                    {t("admin.designApplied")}
                  </span>
                ) : preset.id === "original" ? (
                  <span className="text-muted-foreground border border-border/70 px-2 py-0.5 text-[10px]">
                    {t("admin.designOriginalBadge")}
                  </span>
                ) : preset.dark ? (
                  <span className="text-muted-foreground border border-border/70 px-2 py-0.5 text-[10px]">
                    {t("admin.designDarkBadge")}
                  </span>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {pickLang(preset.nameAr, preset.nameEn, lang)}
                </p>
                <p className="text-muted-foreground mt-1 text-[11px] leading-5">
                  {pickLang(preset.blurbAr, preset.blurbEn, lang)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {current !== "original" ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full sm:w-fit"
          disabled={pending !== null}
          onClick={() => void apply("original")}
        >
          {t("admin.designRestore")}
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Store identity — name, tagline, description, logo and map           */
/* ------------------------------------------------------------------ */

/** Logo field: picks one photo from the device and previews it. */
function LogoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { t } = useI18n();
  const uploadImage = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      onChange(await uploadImage(files[0]!));
    } catch {
      toast.error(t("admin.uploadFailed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("grid gap-2", busy && "opacity-60")}>
      <Label htmlFor="identityLogo">{t("admin.logoImage")}</Label>
      <div className="flex items-center gap-2">
        <Button
          id="identityLogo"
          type="button"
          variant="outline"
          disabled={busy}
          className="h-11 min-w-0 flex-1"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4 shrink-0" />
          <span className="truncate text-xs sm:text-sm">
            {busy ? t("admin.uploading") : t("admin.imageUpload")}
          </span>
        </Button>
        {value ? (
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
            <ProductImage src={value} alt="" sizes="44px" />
            <button
              type="button"
              aria-label={t("admin.delete")}
              onClick={() => onChange("")}
              className="bg-foreground/85 text-background hover:bg-destructive absolute end-0 top-0 grid size-5 place-items-center rounded-full transition-colors"
            >
              ×
            </button>
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files)}
      />
    </div>
  );
}

/** Name, tagline, description, logo and map of the shop — all live. */
function StoreIdentityPanel() {
  const { t } = useI18n();
  const brand = useStoreBrand();
  const setSetting = useMutation(api.catalog.setStoreSetting);

  const [name, setName] = useState(brand.name);
  const [tagline, setTagline] = useState(brand.tagline);
  const [description, setDescription] = useState(brand.description);
  const [map, setMap] = useState(brand.mapEmbedUrl);
  const [logo, setLogo] = useState(brand.logo === "/brand.svg" ? "" : brand.logo);
  const [busy, setBusy] = useState(false);

  // The saved identity can arrive after this panel was first painted.
  useEffect(() => {
    setName(brand.name);
    setTagline(brand.tagline);
    setDescription(brand.description);
    setMap(brand.mapEmbedUrl);
    setLogo(brand.logo === "/brand.svg" ? "" : brand.logo);
  }, [brand.name, brand.tagline, brand.description, brand.mapEmbedUrl, brand.logo]);

  /* The short “35.180678,1.493835” line shown under the map field. */
  const coordinates = mapCoordinates(map);

  async function save(next: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(next)) {
      await setSetting({ adminKey: ADMIN_API_KEY, key: key as never, value });
    }
  }

  async function submit() {
    if (!name.trim()) {
      toast.error(t("admin.brandNameRequired"));
      return;
    }
    // A pasted map link must resolve to something embeddable, or it is refused
    // here instead of leaving a broken frame on the home page.
    if (map.trim() && !toMapEmbedUrl(map)) {
      toast.error(t("admin.mapInvalid"));
      return;
    }
    setBusy(true);
    try {
      await save({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        map: map.trim(),
        logo,
      });
      toast.success(t("admin.identitySaved"));
    } catch {
      toast.error(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  /** Empties the fields: the storefront goes back to its built-in identity. */
  async function resetToDefaults() {
    setBusy(true);
    try {
      // The name is the one value the server requires, so it resets to the
      // built-in name instead of becoming empty.
      await save({
        name: STORE.name,
        tagline: "",
        description: "",
        map: "",
        logo: "",
      });
      setName(STORE.name);
      setTagline("");
      setDescription("");
      setMap("");
      setLogo("");
      toast.success(t("admin.identitySaved"));
    } catch {
      toast.error(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = "grid gap-2";

  return (
    <div className="grid gap-4 rounded-2xl border border-border/70 bg-background p-5">
      <div className="flex items-start gap-3">
        <ImageIcon className="size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("admin.identity")}</p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {t("admin.identityLead")}
          </p>
        </div>
      </div>

      <LogoField value={logo} onChange={setLogo} />
      <p className="text-muted-foreground text-[10px] leading-4">
        {t("admin.logoHint")}
      </p>

      <div className={fieldClass}>
        <Label htmlFor="brandName">{t("admin.brandName")}</Label>
        <Input
          id="brandName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={STORE.name}
        />
        <p className="text-muted-foreground text-[10px] leading-4">
          {t("admin.brandNameHint")}
        </p>
      </div>

      <div className={fieldClass}>
        <Label htmlFor="storeTagline">{t("admin.tagline")}</Label>
        <Input
          id="storeTagline"
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
          placeholder={STORE.tagline}
        />
        <p className="text-muted-foreground text-[10px] leading-4">
          {t("admin.taglineHint")}
        </p>
      </div>

      <div className={fieldClass}>
        <Label htmlFor="storeDescription">{t("admin.siteDescription")}</Label>
        <Textarea
          id="storeDescription"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={STORE.description}
        />
        <p className="text-muted-foreground text-[10px] leading-4">
          {t("admin.siteDescriptionHint")}
        </p>
      </div>

      <div className={fieldClass}>
        <Label htmlFor="storeMap">{t("admin.mapUrl")}</Label>
        <Input
          id="storeMap"
          dir="ltr"
          value={map}
          onChange={(event) => setMap(event.target.value)}
          placeholder={STORE.mapEmbedUrl}
        />
        <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] leading-4">
          <MapPin className="size-3 shrink-0" />
          {t("admin.mapCoordinates")}
          {coordinates ? `: ${coordinates}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="h-11 sm:flex-1"
          disabled={busy}
          onClick={() => void submit()}
        >
          {t("admin.saveChanges")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={busy}
          onClick={() => void resetToDefaults()}
        >
          {t("admin.identityReset")}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Image storage — Cloudflare R2                                       */
/* ------------------------------------------------------------------ */

/** Proves the R2 keys work: upload, public read, delete — all in one tap. */
function R2StoragePanel() {
  const { t } = useI18n();
  const checkConnection = useAction(api.r2.checkConnection);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{
    kind: "idle" | "ok" | "failed";
    detail: string;
  }>({ kind: "idle", detail: "" });

  async function test() {
    setTesting(true);
    try {
      const result = await checkConnection({ adminKey: ADMIN_API_KEY });
      if (result.ok) {
        setStatus({
          kind: "ok",
          detail: t("admin.r2OkDetail", {
            bucket: result.bucket,
            put: result.putStatus,
            get: result.getStatus,
            cleanup: result.cleanupStatus,
          }),
        });
        toast.success(t("admin.r2Ok"));
        return;
      }
      if (result.stage === "config") {
        setStatus({ kind: "failed", detail: result.missing.join("  ·  ") });
        toast.error(t("admin.r2ConfigMissing"));
        return;
      }
      setStatus({
        kind: "failed",
        detail: t("admin.r2FailDetail", {
          put: result.putStatus,
          get: result.getStatus,
        }),
      });
      toast.error(t("admin.r2Failed"));
    } catch {
      setStatus({ kind: "failed", detail: "" });
      toast.error(t("admin.r2Failed"));
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-background p-5">
      <div className="flex items-start gap-3">
        <HardDrive className="size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("admin.r2Title")}</p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {t("admin.r2Hint")}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full sm:w-fit"
        disabled={testing}
        onClick={() => void test()}
      >
        <RefreshCw className={cn("size-4", testing && "animate-spin")} />
        {testing ? t("admin.r2Testing") : t("admin.r2Test")}
      </Button>

      <p
        className={cn(
          "text-[10px] leading-4 break-all",
          status.kind === "ok"
            ? "text-emerald-600"
            : "text-muted-foreground",
        )}
      >
        {status.kind === "idle" ? t("admin.r2Waiting") : status.detail}
      </p>
    </div>
  );
}

/** The whole “Site design” tab: look, identity and image storage. */
export function SiteDesignTab() {
  return (
    <div className="grid gap-5">
      <SiteDesignPanel />
      <StoreIdentityPanel />
      <R2StoragePanel />
    </div>
  );
}
