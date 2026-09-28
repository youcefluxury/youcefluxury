import { useAction, useMutation, useQuery } from "convex/react";
import {
  Check,
  HardDrive,
  Image as ImageIcon,
  MapPin,
  Palette,
  RefreshCw,
  RotateCcw,
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
import { getAdminSession } from "@/lib/admin-key";
import { pickLang, useI18n } from "@/lib/i18n";
import {
  applySiteTheme,
  siteThemeById,
  type SiteThemePreset,
} from "@/lib/site-theme";
import {
  MAP_COORDINATES_PLACEHOLDER,
  STORE,
  mapCoordinates,
  mapSettingValue,
} from "@/lib/store-data";
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
  // The dots wear the palette the store is in right now.
  const palette = preset.tokens;
  const swatches = [
    palette["--ink"] ?? ORIGINAL_SWATCHES.ink,
    palette["--paper"] ?? ORIGINAL_SWATCHES.paper,
    palette["--brand"] ?? ORIGINAL_SWATCHES.brand,
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
 * Design panel: the store has one design and one face, so this shows what is
 * applied and offers a way back to it. The result shows up immediately —
 * before any shopper sees it.
 */
function SiteDesignPanel() {
  const { t, lang } = useI18n();
  const stored = useQuery(api.catalog.getSiteTheme);
  const setSiteTheme = useMutation(api.catalog.setSiteTheme);
  const [pending, setPending] = useState<string | null>(null);

  const current = stored?.theme ?? "original";
  const applied = siteThemeById(current);
  const busy = pending !== null;

  /** Shows the new look at once, then saves it for every visitor. */
  async function commit(id: string) {
    setPending(id);
    // Instant preview: the store restyles before the write comes back.
    applySiteTheme(id);
    try {
      await setSiteTheme({ session: getAdminSession(), theme: id as never });
      toast.success(t("admin.designSaved"));
    } catch {
      applySiteTheme(current);
      toast.error(t("admin.designFailed"));
    } finally {
      setPending(null);
    }
  }

  /** Back to the built-in black & white look this store started with. */
  function restoreOriginal() {
    if (current === "original" || busy) return;
    void commit("original");
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

      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={busy}
          onClick={restoreOriginal}
        >
          <RotateCcw className="size-4" />
          {t("admin.designRestore")}
        </Button>
      </div>

      {/* One design only, so it is shown as the store's identity rather
          than as a list of things to choose between. */}
      <div className="mt-2 grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <ThemeSwatches preset={applied} />
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {pickLang(applied.nameAr, applied.nameEn, lang)}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-5">
              {pickLang(applied.blurbAr, applied.blurbEn, lang)}
            </p>
          </div>
        </div>
        <span className="bg-foreground text-background inline-flex items-center gap-1 self-start px-2 py-0.5 text-[10px] font-medium sm:self-auto">
          <Check className="size-3" />
          {t("admin.designApplied")}
        </span>
      </div>
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
  const [footerAbout, setFooterAbout] = useState(brand.footerAbout);
  const [logo, setLogo] = useState(
    brand.logo === "/logo.png" ? "" : brand.logo,
  );
  const [busy, setBusy] = useState(false);

  // The saved identity can arrive after this panel was first painted.
  useEffect(() => {
    setName(brand.name);
    setTagline(brand.tagline);
    setDescription(brand.description);
    setMap(brand.mapEmbedUrl);
    setLogo(brand.logo === "/logo.png" ? "" : brand.logo);
  }, [
    brand.name,
    brand.tagline,
    brand.description,
    brand.mapEmbedUrl,
    brand.logo,
  ]);

  /* The short “35.180678,1.493835” line shown under the map field. */
  const coordinates = mapCoordinates(map);

  async function save(next: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(next)) {
      await setSetting({
        session: getAdminSession(),
        key: key as never,
        value,
      });
    }
  }

  async function submit() {
    if (!name.trim()) {
      toast.error(t("admin.brandNameRequired"));
      return;
    }
    // Coordinates or a pasted Maps link, both welcome. The setting keeps the
    // plain "lat,lng" whenever there is one, and the link itself otherwise.
    const point = mapSettingValue(map);
    if (map.trim() && !point) {
      toast.error(t("admin.mapInvalid"));
      return;
    }
    setBusy(true);
    try {
      await save({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        map: point,
        footerAbout: footerAbout.trim(),
        logo,
      });
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
        <div className="grid gap-2">
          <Label htmlFor="storeFooterAbout">{t("admin.footerAbout")}</Label>
          <Textarea
            id="storeFooterAbout"
            rows={3}
            value={footerAbout}
            onChange={(event) => setFooterAbout(event.target.value)}
            placeholder={t("footer.about")}
          />
          <p className="text-muted-foreground text-[10px] leading-4">
            {t("admin.footerAboutHint")}
          </p>
        </div>

        <Label htmlFor="storeMap">{t("admin.mapCoordinates")}</Label>
        <Input
          id="storeMap"
          dir="ltr"
          value={map}
          onChange={(event) => setMap(event.target.value)}
          placeholder={MAP_COORDINATES_PLACEHOLDER}
        />
        <p className="text-muted-foreground text-[10px] leading-4">
          {t("admin.mapHint")}
        </p>
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
      const result = await checkConnection({ session: getAdminSession() });
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
          status.kind === "ok" ? "text-emerald-600" : "text-muted-foreground",
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
