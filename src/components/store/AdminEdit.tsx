import { useMutation } from "convex/react";
import { ImagePlus, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { ProductImage, useIsAdminSession } from "@/components/store/bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStoreBrand } from "@/hooks/use-store-brand";
import { useStorePhone } from "@/hooks/use-store-phone";
import { useI18n, type TKey } from "@/lib/i18n";
import {
  MAP_COORDINATES_PLACEHOLDER,
  STORE,
  mapCoordinates,
} from "@/lib/store-data";
import { normalizeLogoImage } from "@/lib/image-compress";
import { useUploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Small admin-only pencil                                             */
/* ------------------------------------------------------------------ */

/**
 * The little pencil the admin sees on top of anything editable. Visitors
 * never render it, so the storefront stays clean for shoppers.
 */
export function AdminPencil({
  label,
  onClick,
  className,
  tone = "light",
}: {
  label: string;
  onClick: () => void;
  className?: string;
  /** "light" = white pencil for dark areas, "dark" = black pencil. */
  tone?: "light" | "dark";
}) {
  const isAdmin = useIsAdminSession();

  if (!isAdmin) return null;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border shadow-sm transition-colors",
        tone === "light"
          ? "bg-background/90 text-foreground hover:bg-foreground hover:text-background border-border/70"
          : "border-foreground bg-foreground text-background hover:opacity-80",
        "size-6",
        className,
      )}
    >
      <Pencil className="size-3" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Shared popup shell — same look as the “add product” popup           */
/* ------------------------------------------------------------------ */

function AdminDialogShell({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* dir="ltr" keeps the popup scrollbar on the right; content is RTL. */}
      <DialogContent
        dir="ltr"
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-md gap-0 overflow-y-auto rounded-none p-5 sm:rounded-lg"
      >
        <DialogClose
          aria-label={t("common.close")}
          className="bg-background/85 text-foreground hover:bg-muted absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-border/70 shadow-sm transition-colors"
        >
          <X className="size-4" />
        </DialogClose>

        <div dir="rtl" className="pl-10 text-right">
          <DialogTitle className="text-base">{title}</DialogTitle>
        </div>

        <div dir="rtl" className="mt-5 grid gap-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Image field (upload from the device, drag & drop, remove)           */
/* ------------------------------------------------------------------ */

function ImageField({
  id,
  label,
  value,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
  onChange: (url: string) => void;
}) {
  const { t } = useI18n();
  /* Already normalised, so the product JPEG pipeline must not touch it. */
  const uploadImage = useUploadImage({ alreadyNormalized: true });
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      // Logos skip the JPEG product pipeline: it would paint a white box
      // behind a transparent file and break the header with a bright gap.
      onChange(await uploadImage(await normalizeLogoImage(files[0]!)));
    } catch {
      toast.error(t("admin.uploadFailed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className={cn("grid gap-2", busy && "opacity-60")}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={busy}
          className={cn(
            "h-11 min-w-0 flex-1",
            dragOver && "border-primary bg-primary/10 ring-primary/30 ring-2",
          )}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4 shrink-0" />
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
              <X className="size-3" />
            </button>
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      {hint ? (
        <p className="text-muted-foreground text-[10px] leading-4">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */

/** Pencil that swaps the store logo, name and tagline (wherever they show). */
export function LogoEditButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const { logo, name, tagline } = useStoreBrand();
  const setSetting = useMutation(api.catalog.setStoreSetting);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(logo);
  const [brandName, setBrandName] = useState(name);
  const [brandTagline, setBrandTagline] = useState(tagline);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(logo);
    setBrandName(name);
    setBrandTagline(tagline);
  }, [open, logo, name, tagline]);

  async function save(next: { logo: string; name: string; tagline: string }) {
    // The server refuses an empty store name, so it is checked up front.
    if (!next.name.trim()) {
      toast.error(t("admin.brandNameRequired"));
      return;
    }
    setBusy(true);
    try {
      await setSetting({
        adminKey: ADMIN_API_KEY,
        key: "name",
        value: next.name.trim(),
      });
      await setSetting({
        adminKey: ADMIN_API_KEY,
        key: "tagline",
        value: next.tagline.trim(),
      });
      await setSetting({
        adminKey: ADMIN_API_KEY,
        key: "logo",
        value: next.logo,
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
        label={t("admin.editIdentity")}
        onClick={() => setOpen(true)}
        className={className}
      />
      <AdminDialogShell
        open={open}
        onOpenChange={setOpen}
        title={t("admin.editIdentity")}
      >
        <div className="grid gap-2">
          <Label htmlFor="logoBrandName">{t("admin.brandName")}</Label>
          <Input
            id="logoBrandName"
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
            placeholder={STORE.name}
          />
          <p className="text-muted-foreground text-[10px] leading-4">
            {t("admin.brandNameHint")}
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="logoBrandTagline">{t("admin.tagline")}</Label>
          <Input
            id="logoBrandTagline"
            value={brandTagline}
            onChange={(event) => setBrandTagline(event.target.value)}
            placeholder={STORE.tagline || undefined}
          />
          <p className="text-muted-foreground text-[10px] leading-4">
            {t("admin.taglineHint")}
          </p>
        </div>
        <ImageField
          id="logoImage"
          label={t("admin.logoImage")}
          value={value === "/brand.svg" ? "" : value}
          hint={t("admin.logoHint")}
          onChange={setValue}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            className="h-11 flex-1"
            disabled={busy}
            onClick={() =>
              void save({
                logo: value,
                name: brandName,
                tagline: brandTagline,
              })
            }
          >
            {t("admin.saveChanges")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={busy}
            onClick={() =>
              void save({ logo: "", name: STORE.name, tagline: "" })
            }
          >
            {t("admin.identityReset")}
          </Button>
        </div>
      </AdminDialogShell>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Instagram                                                           */
/* ------------------------------------------------------------------ */

/** Pencil that edits one social profile link the whole site points to. */
function SocialLinkEditButton({
  settingKey,
  titleKey,
  labelKey,
  hintKey,
  placeholder,
  current,
  className,
}: {
  settingKey: "instagram" | "facebook";
  titleKey: TKey;
  labelKey: TKey;
  hintKey: TKey;
  placeholder: string;
  current: string;
  className?: string;
}) {
  const { t } = useI18n();
  const setSetting = useMutation(api.catalog.setStoreSetting);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setValue(current);
  }, [open, current]);

  async function save() {
    if (!/^https?:\/\//i.test(value.trim())) {
      toast.error(t("admin.invalidLink"));
      return;
    }
    setBusy(true);
    try {
      await setSetting({
        adminKey: ADMIN_API_KEY,
        key: settingKey,
        value: value.trim(),
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
        label={t(titleKey)}
        onClick={() => setOpen(true)}
        className={className}
      />
      <AdminDialogShell open={open} onOpenChange={setOpen} title={t(titleKey)}>
        <div className="grid gap-2">
          <Label htmlFor={`${settingKey}Url`}>{t(labelKey)}</Label>
          <Input
            id={`${settingKey}Url`}
            dir="ltr"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
          />
          <p className="text-muted-foreground text-[10px] leading-4">
            {t(hintKey)}
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

/** Pencil that edits the Instagram profile the whole site links to. */
export function InstagramEditButton({ className }: { className?: string }) {
  const { instagram } = useStoreBrand();
  return (
    <SocialLinkEditButton
      settingKey="instagram"
      titleKey="admin.editInstagram"
      labelKey="admin.instagramUrl"
      hintKey="admin.instagramHint"
      placeholder="https://instagram.com/your-store"
      current={instagram}
      className={className}
    />
  );
}

/** Pencil that edits the Facebook page the whole site links to. */
export function FacebookEditButton({ className }: { className?: string }) {
  const { facebook } = useStoreBrand();
  return (
    <SocialLinkEditButton
      settingKey="facebook"
      titleKey="admin.editFacebook"
      labelKey="admin.facebookUrl"
      hintKey="admin.facebookHint"
      placeholder="https://facebook.com/your-store"
      current={facebook}
      className={className}
    />
  );
}

/* ------------------------------------------------------------------ */
/* WhatsApp — the store phone number in its international form         */
/* ------------------------------------------------------------------ */

/** Pencil that changes the number behind the WhatsApp icon and the call pill. */
export function WhatsAppEditButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const { phone } = useStorePhone();
  const setPhone = useMutation(api.catalog.setPhone);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(phone);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setValue(phone);
  }, [open, phone]);

  async function save() {
    const digits = value.replace(/\D+/g, "");
    if (digits.length < 9) {
      toast.error(t("phone.invalid"));
      return;
    }
    setBusy(true);
    try {
      await setPhone({ adminKey: ADMIN_API_KEY, phone: digits });
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
        label={t("admin.editWhatsapp")}
        onClick={() => setOpen(true)}
        className={className}
      />
      <AdminDialogShell
        open={open}
        onOpenChange={setOpen}
        title={t("admin.editWhatsapp")}
      >
        <div className="grid gap-2">
          <Label htmlFor="whatsappNumber">{t("phone.title")}</Label>
          <Input
            id="whatsappNumber"
            dir="ltr"
            inputMode="tel"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t("phone.placeholder")}
          />
          <p className="text-muted-foreground text-[10px] leading-4">
            {t("admin.whatsappHint")}
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

/* ------------------------------------------------------------------ */
/* Map — coordinates only, never a link                                */
/* ------------------------------------------------------------------ */

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
    // A bare pair, a pair with a zoom level, or a pasted Maps link: whatever
    // reduces to a point is what gets stored.
    const point = mapCoordinates(value);
    if (!point) {
      toast.error(t("admin.mapInvalid"));
      return;
    }
    setBusy(true);
    try {
      await setSetting({
        adminKey: ADMIN_API_KEY,
        key: "map",
        value: point,
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
            placeholder={MAP_COORDINATES_PLACEHOLDER}
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

/* ------------------------------------------------------------------ */
/* Category                                                            */
/* ------------------------------------------------------------------ */

/** The category row the edit popup works with. */
export type EditableCategory = {
  _id: string;
  slug: string;
  image: string;
  sizes?: string[];
  hasSizeGuide?: boolean;
};

/** "sports-shoes" → "Sports Shoes" — the slug doubles as the display name. */
function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Edit popup for one category: its name (slug) and its photo. */
export function CategoryEditDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  category: EditableCategory;
}) {
  const { t } = useI18n();
  const updateCategory = useMutation(api.catalog.updateCategory);
  const [slug, setSlug] = useState(category.slug);
  const [image, setImage] = useState(category.image);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSlug(category.slug);
    setImage(category.image);
  }, [open, category.slug, category.image]);

  async function save() {
    if (!slug.trim() || !image.trim()) {
      toast.error(t("admin.categoryRequired"));
      return;
    }
    setBusy(true);
    try {
      const label = slugToLabel(slug.trim());
      await updateCategory({
        adminKey: ADMIN_API_KEY,
        id: category._id as never,
        slug: slug.trim(),
        nameAr: label,
        nameEn: label,
        image: image.trim(),
        sizes: category.sizes ?? [],
        hasSizeGuide: category.hasSizeGuide ?? false,
      });
      toast.success(t("admin.categorySaved"));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("admin.saveFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("admin.editCategory")}
    >
      <div className="grid gap-2">
        <Label htmlFor="categorySlug">{t("admin.slug")}</Label>
        <Input
          id="categorySlug"
          dir="ltr"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder={t("admin.slugPlaceholder")}
        />
        <p className="text-muted-foreground text-[10px] leading-4">
          {t("admin.slugHint")}
        </p>
      </div>
      <ImageField
        id="categoryImage"
        label={t("admin.categoryImage")}
        value={image}
        onChange={setImage}
      />
      <Button
        type="button"
        className="h-11 w-full"
        disabled={busy}
        onClick={() => void save()}
      >
        {t("admin.saveChanges")}
      </Button>
    </AdminDialogShell>
  );
}

/** Pencil + popup for a category shown somewhere on the storefront. */
export function CategoryEditButton({
  category,
  className,
  tone = "light",
}: {
  category: EditableCategory;
  className?: string;
  tone?: "light" | "dark";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdminPencil
        label={t("admin.editCategory")}
        onClick={() => setOpen(true)}
        className={className}
        tone={tone}
      />
      <CategoryEditDialog
        open={open}
        onOpenChange={setOpen}
        category={category}
      />
    </>
  );
}
