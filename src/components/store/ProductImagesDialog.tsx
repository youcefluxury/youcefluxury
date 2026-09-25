import { useMutation } from "convex/react";
import { ImagePlus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { ProductImage } from "@/components/store/bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { COLOR_KEYS, colorLabel, colorSwatch, sizeLabel } from "@/lib/store-data";
import type { Product } from "@/lib/store-types";
import { useUploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

/**
 * The admin's “＋” on the product page: adds photos to the product being
 * viewed (as many as wanted) without opening the whole edit form. Photos are
 * uploaded from the device and any of them can be removed. The first photo in
 * the list is the cover used on the product card.
 *
 * Every photo carries its own colour — tapping that colour on the product page
 * shows that photo right away — and its own list of sold-out sizes, so marking
 * a size on one photo never touches another photo.
 */
export function ProductImagesDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  product: Product;
}) {
  const { t, lang } = useI18n();
  const saveImages = useMutation(api.catalog.setProductImages);
  const uploadImage = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  /** One colour per photo, index-aligned with `images`. */
  const [colors, setColors] = useState<string[]>([]);
  /**
   * Sold-out sizes per photo, index-aligned with `images`: every photo keeps
   * its own list, so marking a size on one photo leaves the others alone.
   */
  const [photoSizes, setPhotoSizes] = useState<string[][]>([]);
  /**
   * The single colour applied to the photos added from now on. Every photo
   * starts on one: the product's own first colour when it has any, otherwise
   * the first colour of the palette.
   */
  const [newColor, setNewColor] = useState(COLOR_KEYS[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /** Fallback for a photo that was saved before colours existed. */
  const defaultColor = product.colors.filter(Boolean)[0] ?? COLOR_KEYS[0] ?? "";

  /* Every opening starts from what the product currently has. */
  useEffect(() => {
    if (!open) return;
    setImages(product.images);
    setColors(
      product.images.map(
        (_, index) => product.imageColors?.[index] || defaultColor,
      ),
    );
    setNewColor(defaultColor);
    /* Each photo starts from its own list. A photo saved before per-photo
       sizes existed shows what was set for its colour, so the admin always
       sees the state the shopper gets. */
    setPhotoSizes(
      product.images.map((_, index) => {
        const own = product.imageSizes?.[index];
        if (own && own.length > 0) return own;
        const photoColor = product.imageColors?.[index] || defaultColor;
        const colorRow = (product.soldOutByColor ?? []).find(
          (row) => row.color.toLowerCase() === photoColor.toLowerCase(),
        );
        return colorRow?.sizes ?? [];
      }),
    );
    setDragOver(false);
  }, [open, product, defaultColor]);

  /** Taps one size of one photo on / off — that photo only. */
  function togglePhotoSize(index: number, size: string) {
    setPhotoSizes((current) =>
      current.map((row, position) =>
        position === index
          ? row.includes(size)
            ? row.filter((item) => item !== size)
            : [...row, size]
          : row,
      ),
    );
  }

  /** Appends freshly added photos, each stamped with the chosen colour. */
  function appendPhotos(urls: { url: string; color: string }[]) {
    setImages((current) => [...current, ...urls.map((entry) => entry.url)]);
    setColors((current) => [...current, ...urls.map((entry) => entry.color)]);
    // New photos start with no sold-out sizes of their own.
    setPhotoSizes((current) => [...current, ...urls.map(() => [])]);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: { url: string; color: string }[] = [];
      for (const file of Array.from(files)) {
        uploaded.push({ url: await uploadImage(file), color: newColor });
      }
      appendPhotos(uploaded);
    } catch {
      toast.error(t("admin.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** Removes a photo with its colour and its sizes, keeping the lists aligned. */
  function removePhoto(index: number) {
    setImages((current) => current.filter((_, position) => position !== index));
    setColors((current) => current.filter((_, position) => position !== index));
    setPhotoSizes((current) =>
      current.filter((_, position) => position !== index),
    );
  }

  /** Changes the single colour of one existing photo. */
  function setPhotoColor(index: number, value: string) {
    setColors((current) =>
      current.map((color, position) => (position === index ? value : color)),
    );
  }

  async function handleSave() {
    if (images.length === 0) {
      toast.error(t("product.photoRequired"));
      return;
    }
    setBusy(true);
    try {
      await saveImages({
        adminKey: ADMIN_API_KEY,
        id: product._id,
        images,
        imageColors: colors,
        imageSizes: photoSizes,
      });
      toast.success(t("product.photosSaved"));
      onOpenChange(false);
    } catch {
      toast.error(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-lg gap-0 overflow-y-auto rounded-none p-5 sm:rounded-lg"
      >
        <DialogClose
          aria-label={t("common.close")}
          className="bg-background/85 text-foreground hover:bg-muted absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-border/70 shadow-sm transition-colors"
        >
          <X className="size-4" />
        </DialogClose>

        <DialogHeader className="pl-10 text-right">
          <DialogTitle className="text-base">
            {t("product.managePhotos")}
          </DialogTitle>
          <DialogDescription className="text-[11px] leading-5">
            {t("product.photosHint")}
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn("mt-4 grid gap-2", uploading && "opacity-60")}
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
          <Label htmlFor="productPhotos">{t("admin.images")}</Label>
          <Button
            id="productPhotos"
            type="button"
            variant="outline"
            disabled={uploading}
            className={cn(
              "h-11 w-full",
              dragOver && "border-primary bg-primary/10 ring-primary/30 ring-2",
            )}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4 shrink-0" />
            <span className="truncate text-xs sm:text-sm">
              {uploading ? t("admin.uploading") : t("admin.imageUpload")}
            </span>
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
          />

          {/* Which colour the next uploaded photo belongs to — one only. */}
          <div className="mt-1 grid gap-2">
            <Label>{t("product.newPhotoColor")}</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_KEYS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setNewColor(option)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] transition-colors",
                    newColor === option
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/40",
                  )}
                >
                  <span
                    className="size-3.5 rounded-full border border-border/60"
                    style={{ background: colorSwatch(option) }}
                  />
                  {colorLabel(option, lang)}
                </button>
              ))}
            </div>
          </div>

          {images.length > 0 ? (
            <div className="mt-1 grid gap-2">
              {images.map((image, index) => {
                const photoColor = colors[index] ?? "";
                const outSizes = photoSizes[index] ?? [];
                return (
                  <div
                    key={image + index}
                    className="grid gap-2 rounded-lg border border-border/70 bg-muted/40 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted">
                        <ProductImage src={image} alt="" sizes="64px" />
                        {index === 0 ? (
                          <span className="bg-foreground/85 text-background absolute bottom-0 start-0 rounded-se-md px-1.5 py-0.5 text-[9px]">
                            {t("product.coverTag")}
                          </span>
                        ) : null}
                      </div>
                      {/* A native select can only ever give one colour. */}
                      <div className="min-w-0 flex-1">
                        <select
                          value={photoColor}
                          onChange={(event) =>
                            setPhotoColor(index, event.target.value)
                          }
                          aria-label={t("product.photoColor")}
                          className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                        >
                          {COLOR_KEYS.map((option) => (
                            <option key={option} value={option}>
                              {colorLabel(option, lang)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        aria-label={t("admin.delete")}
                        onClick={() => removePhoto(index)}
                        className="bg-foreground/85 text-background hover:bg-destructive grid size-7 shrink-0 place-items-center rounded-full transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    {/* Sizes of this photo alone: tapping one marks it sold out
                        for this photo, and no other photo changes. */}
                    {product.sizes.length > 0 ? (
                      <div className="grid gap-1.5 border-t border-border/60 pt-2">
                        <p className="text-muted-foreground text-[10px] font-medium">
                          {t("product.sizesForColor", {
                            color: colorLabel(photoColor || defaultColor, lang),
                          })}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {product.sizes.map((item) => {
                            const out = outSizes.includes(item.label);
                            return (
                              <button
                                key={item.label}
                                type="button"
                                aria-pressed={out}
                                title={t("admin.colorStockHint")}
                                onClick={() => togglePhotoSize(index, item.label)}
                                className={cn(
                                  "grid h-7 min-w-9 place-items-center rounded-full border px-2 text-[11px] font-medium transition-colors",
                                  out
                                    ? "border-destructive/60 bg-destructive/10 text-destructive line-through"
                                    : "border-border hover:border-foreground/40",
                                )}
                              >
                                {sizeLabel(item.label, lang)}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-muted-foreground text-[10px] leading-4">
                          {t("admin.colorStockHint")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            className="h-11 flex-1"
            disabled={busy || uploading}
            onClick={() => void handleSave()}
          >
            <Plus className="size-4" />
            {t("admin.saveChanges")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
