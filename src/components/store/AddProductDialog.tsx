import { useMutation, useQuery } from "convex/react";
import { Check, ImagePlus, Plus, X } from "lucide-react";
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
import { useI18n } from "@/lib/i18n";
import { COLOR_KEYS, colorLabel, colorSwatch, categoryName, formatDA, sizeLabel } from "@/lib/store-data";
import type { Product } from "@/lib/store-types";
import { useUploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

/* Same size catalogue the dashboard form offers. */
const SIZE_LETTERS = ["S", "M", "L", "XL", "XXL", "3XL", "ONE SIZE"];
const SIZE_NUMBERS = Array.from({ length: 19 }, (_, index) => String(28 + index));

/**
 * The admin's “+” on a category page: opens the dashboard's product form as a
 * centred popup (with an X to close it) so a new piece can be added to that
 * category without ever leaving the storefront.
 */
export function AddProductButton({
  categorySlug,
  className,
}: {
  /** Slug of the category currently open — preselected in the form. */
  categorySlug: string;
  className?: string;
}) {
  const { t } = useI18n();
  const isAdmin = useIsAdminSession();
  const [open, setOpen] = useState(false);

  /* Visitors never see this button. */
  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("addProduct.open")}
        title={t("addProduct.open")}
        onClick={() => setOpen(true)}
        className={cn(
          "border-foreground bg-foreground text-background hover:opacity-80 grid size-7 shrink-0 place-items-center rounded-full border transition-opacity",
          className,
        )}
      >
        <Plus className="size-4" />
      </button>
      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        defaultCategory={categorySlug}
      />
    </>
  );
}

/**
 * The dashboard's product form as a popup. Opening it without a product adds
 * a new one; passing a product loads every current value for editing.
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  defaultCategory = "",
  product,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  defaultCategory?: string;
  /** When set, the popup edits this product instead of creating one. */
  product?: Product;
}) {
  const { t, lang } = useI18n();
  const rows = useQuery(api.catalog.listCategories) ?? [];
  const createProduct = useMutation(api.catalog.createProduct);
  const updateProduct = useMutation(api.catalog.updateProduct);
  const uploadImage = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nameAr, setNameAr] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  /** Delivery price for this product — empty falls back to the shop default. */
  const [deliveryFee, setDeliveryFee] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [images, setImages] = useState<string[]>([]);
  /** One colour per photo, index-aligned with `images`. */
  const [imageColors, setImageColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [soldOutSizes, setSoldOutSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  /**
   * Sizes sold out for one specific colour — keyed by the colour key, exactly
   * what the shopper's colour switch reads back on the product page.
   */
  const [colorStock, setColorStock] = useState<Record<string, string[]>>({});
  /** Featured products lead the home page, so a new product starts featured. */
  const [featured, setFeatured] = useState(true);
  const [soldOut, setSoldOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /* Opening with a product loads it; otherwise the form starts clean. */
  useEffect(() => {
    if (!open) return;
    if (product) {
      setCategory(product.category);
      setNameAr(product.nameAr);
      setPrice(String(product.price));
      setOldPrice(product.oldPrice ? String(product.oldPrice) : "");
      setDeliveryFee(product.deliveryFee ? String(product.deliveryFee) : "");
      setImages(product.images);
      setImageColors(
        product.images.map((_, index) => product.imageColors?.[index] ?? ""),
      );
      setSizes(product.sizes.map((size) => size.label));
      setSoldOutSizes(
        product.sizes.filter((size) => !size.available).map((size) => size.label),
      );
      setColors(product.colors);
      setColorStock(
        Object.fromEntries(
          (product.soldOutByColor ?? []).map((row) => [row.color, row.sizes]),
        ),
      );
      setFeatured(product.featured);
      setSoldOut(product.soldOut);
      return;
    }
    setCategory(defaultCategory);
    setNameAr("");
    setPrice("");
    setOldPrice("");
    setDeliveryFee("");
    setImages([]);
    setImageColors([]);
    setSizes([]);
    setSoldOutSizes([]);
    setColors([]);
    setColorStock({});
    setFeatured(true);
    setSoldOut(false);
  }, [open, product, defaultCategory]);

  const known = new Set([...SIZE_LETTERS, ...SIZE_NUMBERS]);
  const extraSizes = sizes.filter((size) => !known.has(size));
  const sizeOptions = [...SIZE_LETTERS, ...SIZE_NUMBERS, ...extraSizes];

  /**
   * The colours a photo can be tagged with — the whole palette, because a
   * product is sold in as many colours as it has photos: a black shot and a
   * red shot of the same piece are two photos with two colours.
   */
  const photoColorChoices = COLOR_KEYS;
  const fallbackImageColor = photoColorChoices[0] ?? "";
  /** Every photo keeps exactly one colour. */
  const photoColorAt = (index: number) => {
    const value = imageColors[index] ?? "";
    return photoColorChoices.includes(value) ? value : fallbackImageColor;
  };

  /**
   * Colours that get their own stock rules: the ones worn by the photos plus
   * the product's own colour.
   */
  const stockColors = [
    ...new Set([...imageColors.filter(Boolean), ...colors.filter(Boolean)]),
  ];

  /** Removes a photo together with its colour, so the lists stay aligned. */
  function removeImage(index: number) {
    setImages((current) => current.filter((_, position) => position !== index));
    setImageColors((current) =>
      current.filter((_, position) => position !== index),
    );
  }

  function toggle(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadImage(file));
      }
      setImages((current) => [...current, ...urls]);
      // New photos start on the current colour and can be re-tagged below.
      setImageColors((current) => [
        ...current,
        ...urls.map(() => fallbackImageColor),
      ]);
    } catch {
      toast.error(t("admin.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!nameAr.trim()) {
      toast.error(t("admin.nameRequired"));
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error(t("admin.priceRequired"));
      return;
    }
    if (!category) {
      toast.error(t("admin.productCategoryRequired"));
      return;
    }

    setBusy(true);
    try {
      const payload = {
        adminKey: ADMIN_API_KEY,
        nameAr: nameAr.trim(),
        // Only the Arabic name is asked for — mirrored so the English view reads
        // the same, exactly like the dashboard form does.
        nameEn: nameAr.trim(),
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : undefined,
        deliveryFee: deliveryFee.trim() ? Number(deliveryFee) : undefined,
        category,
        images,
        imageColors: images.map((_, index) => photoColorAt(index)),
        sizes: sizes.map((label) => ({
          label,
          available: !soldOutSizes.includes(label),
        })),
        colors,
        // Per-colour stock: one row per colour used by the photos or the product.
        soldOutByColor: stockColors.map((color) => ({
          color,
          sizes: colorStock[color] ?? [],
        })),
        soldOut,
        featured,
        // The description field is gone, so an existing text is never erased.
        descriptionAr: product?.descriptionAr ?? "",
        descriptionEn: product?.descriptionEn ?? "",
      };

      if (product) {
        await updateProduct({ ...payload, id: product._id });
        toast.success(t("admin.productUpdated"));
      } else {
        await createProduct(payload);
        toast.success(t("admin.productAdded"));
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t("admin.saveFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        dir="ltr" on the popup shell keeps its own vertical scrollbar on the
        right-hand side; each block inside is dir="rtl" so the form reads from
        right to left like the rest of the store.
      */}
      <DialogContent
        dir="ltr"
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-xl gap-0 overflow-y-auto rounded-none p-5 sm:rounded-lg"
      >
        {/* The X stays in its original corner — the left side of the popup. */}
        <DialogClose
          aria-label={t("common.close")}
          className="bg-background/85 text-foreground hover:bg-muted absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-border/70 shadow-sm transition-colors"
        >
          <X className="size-4" />
        </DialogClose>

        <div dir="rtl" className="pl-10 text-right">
          <DialogTitle className="text-base">
            {product ? t("admin.editProduct") : t("admin.newProduct")}
          </DialogTitle>
        </div>

        <form dir="rtl" onSubmit={submit} className="mt-5 grid gap-4">
          {rows.length > 0 ? (
            <div className="grid gap-2">
              <Label>{t("admin.category")}</Label>
              {/* Same cards as the dashboard: category photo + name. */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {rows.map((row) => {
                  const selected = category === row.slug;
                  return (
                    <button
                      key={row._id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setCategory(row.slug)}
                      className={cn(
                        "overflow-hidden rounded-xl border text-start transition-colors",
                        selected
                          ? "border-foreground ring-foreground/30 ring-2"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      <span className="block h-16 w-full overflow-hidden bg-muted">
                        <ProductImage
                          src={row.image}
                          alt={categoryName(row, lang)}
                          sizes="120px"
                        />
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1.5 text-[11px]",
                          selected && "font-semibold",
                        )}
                      >
                        {selected ? <Check className="size-3.5 shrink-0" /> : null}
                        <span className="truncate">{categoryName(row, lang)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="addNameAr">{t("admin.nameAr")}</Label>
            <Input
              id="addNameAr"
              value={nameAr}
              onChange={(event) => setNameAr(event.target.value)}
              placeholder={t("admin.nameArPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="addPrice">{t("admin.price")}</Label>
              <Input
                id="addPrice"
                inputMode="numeric"
                dir="ltr"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addDelivery">{t("admin.deliveryFee")}</Label>
              <Input
                id="addDelivery"
                inputMode="numeric"
                dir="ltr"
                value={deliveryFee}
                onChange={(event) => setDeliveryFee(event.target.value)}
                placeholder="0"
              />
              <p className="text-muted-foreground text-[10px] leading-4">
                {t("admin.deliveryFeeHint")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="addOldPrice">{t("admin.oldPrice")}</Label>
              <Input
                id="addOldPrice"
                inputMode="numeric"
                dir="ltr"
                value={oldPrice}
                onChange={(event) => setOldPrice(event.target.value)}
                placeholder="0"
              />
              <p className="text-muted-foreground text-[10px] leading-4">
                {oldPrice
                  ? t("admin.discountOn", {
                      save: formatDA(
                        Math.max(0, Number(price || 0) - Number(oldPrice)),
                      ),
                    })
                  : t("admin.discountOff")}
              </p>
            </div>
          </div>

          {/* Photos straight from the device. */}
          <div
            className={cn("grid gap-2", uploading && "opacity-60")}
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
            <Label htmlFor="addImages">{t("admin.images")}</Label>
            <Button
              id="addImages"
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
            <p className="text-muted-foreground text-[10px] leading-4">
              {t("admin.imagesHint")}
            </p>
            {images.length > 0 ? (
              <div className="grid gap-2">
                {images.map((url, index) => (
                  <div
                    key={url + index}
                    className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 p-2"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted">
                      <ProductImage src={url} alt="" sizes="64px" />
                      {index === 0 ? (
                        <span className="bg-foreground/85 text-background absolute bottom-0 start-0 rounded-se-md px-1.5 py-0.5 text-[9px]">
                          {t("product.coverTag")}
                        </span>
                      ) : null}
                    </div>
                    {/* One colour per photo — the colour the shopper taps to
                        see this picture. */}
                    <select
                      value={photoColorAt(index)}
                      onChange={(event) =>
                        setImageColors((current) =>
                          current.map((color, position) =>
                            position === index ? event.target.value : color,
                          ),
                        )
                      }
                      aria-label={t("product.photoColor")}
                      className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      {photoColorChoices.map((option) => (
                        <option key={option} value={option}>
                          {colorLabel(option, lang)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={t("admin.delete")}
                      onClick={() => removeImage(index)}
                      className="bg-foreground/85 text-background hover:bg-destructive grid size-7 shrink-0 place-items-center rounded-full transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Sizes this piece comes in — tapped, never typed. */}
          <div className="grid gap-2">
            <Label>{t("admin.availableSizes")}</Label>
            <div className="flex max-w-full flex-wrap gap-1.5">
              {sizeOptions.map((size) => {
                const picked = sizes.includes(size);
                const out = soldOutSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={picked}
                    onClick={() => {
                      const next = toggle(sizes, size);
                      setSizes(next);
                      setSoldOutSizes((current) =>
                        current.filter((item) => next.includes(item)),
                      );
                    }}
                    className={cn(
                      "grid h-9 min-w-11 place-items-center rounded-full border px-3 text-xs font-medium transition-colors",
                      picked
                        ? out
                          ? "border-destructive/60 bg-destructive/10 text-destructive line-through"
                          : "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/40",
                    )}
                  >
                    {sizeLabel(size, lang)}
                  </button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-[10px] leading-4">
              {t("admin.availableSizesHint")}
            </p>
          </div>

          {sizes.length > 0 ? (
            <div className="grid gap-2">
              <Label>{t("admin.soldOutSizes")}</Label>
              <div className="flex max-w-full flex-wrap gap-1.5">
                {sizes.map((size) => {
                  const out = soldOutSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={out}
                      onClick={() => setSoldOutSizes((current) => toggle(current, size))}
                      className={cn(
                        "grid h-9 min-w-11 place-items-center rounded-full border px-3 text-xs font-medium transition-colors",
                        out
                          ? "border-destructive/60 bg-destructive/10 text-destructive line-through"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      {sizeLabel(size, lang)}
                    </button>
                  );
                })}
              </div>
              <p className="text-muted-foreground text-[10px] leading-4">
                {t("admin.soldOutSizesHint")}
              </p>
            </div>
          ) : null}

          {/* One colour per product: the rest of the colours come from the
              photos below, where each picture carries a single colour. */}
          <div className="grid gap-2">
            <Label>{t("admin.colors")}</Label>
            <div className="flex max-w-full flex-wrap gap-1.5">
              {COLOR_KEYS.map((key) => {
                const selected = colors.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setColors(selected ? [] : [key])}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/40",
                    )}
                  >
                    {selected ? <Check className="size-3.5 shrink-0" /> : null}
                    {colorLabel(key, "ar")}
                  </button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-[11px]">
              {colors.length === 0
                ? t("admin.noColorNote")
                : t("admin.singleColorHint")}
            </p>
          </div>

          {/* Per-colour stock: sizes sold out for each picked colour. */}
          {stockColors.length > 0 && sizes.length > 0 ? (
            <div className="grid gap-3">
              <Label>{t("admin.colorStock")}</Label>
              {stockColors.map((color) => {
                const outForColor = colorStock[color] ?? [];
                return (
                  <div key={color} className="grid gap-1.5 rounded-xl border border-border/70 p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-border/60"
                        style={{ background: colorSwatch(color) }}
                      />
                      <p className="text-xs font-medium">{colorLabel(color, "ar")}</p>
                    </div>
                    <div className="flex max-w-full flex-wrap gap-1.5">
                      {sizes.map((size) => {
                        const out = outForColor.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            aria-pressed={out}
                            onClick={() =>
                              setColorStock((current) => ({
                                ...current,
                                [color]: out
                                  ? (current[color] ?? []).filter((item) => item !== size)
                                  : [...(current[color] ?? []), size],
                              }))
                            }
                            className={cn(
                              "grid h-8 min-w-10 place-items-center rounded-full border px-2.5 text-[11px] font-medium transition-colors",
                              out
                                ? "border-destructive/60 bg-destructive/10 text-destructive line-through"
                                : "border-border hover:border-foreground/40",
                            )}
                          >
                            {sizeLabel(size, lang)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="text-muted-foreground text-[10px] leading-4">
                {t("admin.colorStockHint")}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
                className="size-4"
              />
              {t("admin.featured")}
            </label>
            {product ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={soldOut}
                  onChange={(event) => setSoldOut(event.target.checked)}
                  className="size-4"
                />
                {t("admin.soldOutFlag")}
              </label>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="h-11 flex-1" disabled={busy || uploading}>
              <Plus className="size-4" />
              {product ? t("admin.saveChanges") : t("admin.addProduct")}
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
