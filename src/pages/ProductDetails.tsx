import { useQuery } from "convex/react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { ProductFormDialog } from "@/components/store/AddProductDialog";
import { AdminPencil } from "@/components/store/AdminEdit";
import {
  Badge,
  ProductImage,
  SectionHeading,
  useIsAdminSession,
} from "@/components/store/bits";
import { ProductImagesDialog } from "@/components/store/ProductImagesDialog";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreClock } from "@/hooks/use-store-clock";
import { pickLang, useI18n } from "@/lib/i18n";
import {
  UNKNOWN_COLOR,
  colorLabel,
  colorSwatch,
  formatDA,
  isHiddenFromStore,
  liveCategoryLabel,
  sizeLabel,
} from "@/lib/store-data";
import { flyToCart, useCart } from "@/lib/store-state";
import type { Product } from "@/lib/store-types";
import { cn } from "@/lib/utils";

/**
 * Colours the shopper can pick on the product page: one colour per photo, in
 * photo order (a black shot and a red shot give two colour buttons). Products
 * whose photos carry no colour yet fall back to the colour picked for them in
 * the dashboard, so nothing ever loses its colour switch.
 */
function shopperColors(product: Product): string[] {
  const fromPhotos = (product.imageColors ?? []).filter(Boolean);
  const list =
    fromPhotos.length > 0 ? fromPhotos : product.colors.filter(Boolean);
  return [...new Set(list)];
}

/** Pencil on the product page that re-opens the full product form. */
function ProductPageEditButton({ product }: { product: Product }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdminPencil
        label={t("admin.editProduct")}
        onClick={() => setOpen(true)}
        tone="dark"
      />
      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        product={product}
        defaultCategory={product.category}
      />
    </>
  );
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { t, lang, isAr } = useI18n();
  const product = useQuery(api.catalog.getProduct, { id: id ?? "" });
  const related = useQuery(api.catalog.listProducts);
  const categoryRows = useQuery(api.catalog.listCategories);

  const { addItem, openCart } = useCart();
  const galleryRef = useRef<HTMLDivElement>(null);
  /* The admin gets a “＋” on the gallery to add more photos right here. */
  const isAdmin = useIsAdminSession();
  const [photosOpen, setPhotosOpen] = useState(false);
  /* Once a sold-out product's 24 hours are over its page leaves the site too. */
  const now = useStoreClock();
  const hidden = product ? isHiddenFromStore(product, now) : false;

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;
    setActiveImage(0);
    setQuantity(1);
    setColor(shopperColors(product)[0] ?? "");
    setSize("");
  }, [product]);

  /* A colour switch re-checks the size: the previous pick may be sold out
     for the new colour, and the gallery jumps to that colour's photo. */
  useEffect(() => {
    if (!product) return;
    const stillOk = product.sizes.find(
      (item) => item.label === size && item.available &&
        !soldOutForColor.has(item.label),
    );
    if (!stillOk) {
      const first = product.sizes.find(
        (item) => item.available && !soldOutForColor.has(item.label),
      );
      setSize(first?.label ?? "");
    }
    /* Every photo can be tied to one colour by the admin: picking that colour
       brings its photo up immediately. Colours without a photo show the cover. */
    const colorPhoto = (product.imageColors ?? []).findIndex(
      (value) => value && value.toLowerCase() === color.toLowerCase(),
    );
    setActiveImage(colorPhoto >= 0 ? colorPhoto : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, product]);

  const relatedProducts = useMemo(() => {
    if (!product || !related) return [];
    return related
      .filter(
        (item) =>
          item.category === product.category &&
          item._id !== product._id &&
          !isHiddenFromStore(item, now),
      )
      .slice(0, 4);
  }, [product, related, now]);

  /**
   * Sizes sold out for what the shopper picked. Each photo keeps its own list,
   * so the red photo can be out of M while the black one still has it — and
   * any colour-wide rule set in the dashboard applies on top. A colour with no
   * rules at all falls back to the global availability only. Must stay before
   * any early return so the hook order never changes.
   */
  const soldOutForColor = useMemo(() => {
    if (!color || !product) return new Set<string>();
    const out = new Set<string>();
    const photoIndex = (product.imageColors ?? []).findIndex(
      (value) => value && value.toLowerCase() === color.toLowerCase(),
    );
    for (const size of (photoIndex >= 0 ? product.imageSizes?.[photoIndex] : undefined) ??
      []) {
      out.add(size);
    }
    const row = (product.soldOutByColor ?? []).find(
      (entry) => entry.color.toLowerCase() === color.toLowerCase(),
    );
    for (const size of row?.sizes ?? []) out.add(size);
    return out;
  }, [product, color]);

  if (product === undefined) {
    return (
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <Skeleton className="h-[520px] rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      </div>
    );
  }

  /* Not found — or sold out for more than 24h, which removes it from the site. */
  if (product === null || hidden) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
        <p className="text-lg font-semibold">{t("product.notFound")}</p>
        <Button asChild variant="outline">
          <Link to="/shop">{t("product.backToShop")}</Link>
        </Button>
      </div>
    );
  }

  const name = pickLang(product.nameAr, product.nameEn, lang);

  /** A size is buyable when it is globally available AND not sold out in the
   *  selected colour. Without a colour, only the global rule applies. */
  const sizeAvailable = (label: string, globallyAvailable: boolean) =>
    globallyAvailable && !soldOutForColor.has(label) && !product.soldOut;

  const selectableSizes = product.sizes.filter((item) =>
    sizeAvailable(item.label, item.available),
  );

  /** The photo the admin tied to this colour (-1 when it has none). */
  const photoForColor = (option: string) =>
    (product.imageColors ?? []).findIndex(
      (value) => value && value.toLowerCase() === option.toLowerCase(),
    );

  /** Gallery step used by the round buttons inside the photo, wrapping at
   *  both ends so “next” on the last photo goes back to the first. */
  const stepPhoto = (direction: 1 | -1) => {
    const total = product.images.length;
    if (total < 2) return;
    setActiveImage((current) => (current + direction + total) % total);
  };
  const headingClass = cn(
    "text-xs font-medium",
    isAr ? "tracking-[0.08em]" : "tracking-[0.16em] uppercase",
  );

  function handleAdd(openAfter = false) {
    if (!size) {
      toast.error(t("product.chooseSize"));
      return;
    }
    /* The cart and the order carry the photo of the chosen colour, so the
       admin sees exactly the variant that was ordered. */
    const colorPhoto = photoForColor(color);
    const cartImage =
      product!.images[colorPhoto >= 0 ? colorPhoto : 0] ?? "";
    addItem(
      {
        productId: product!._id,
        nameAr: product!.nameAr,
        nameEn: product!.nameEn,
        price: product!.price,
        size,
        color: color || "—",
        image: cartImage,
        deliveryFee: product!.deliveryFee,
      },
      quantity,
    );
    flyToCart(galleryRef.current, cartImage);
    if (openAfter) {
      openCart();
    } else {
      toast.success(t("product.added"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <Link to="/" className="hover:text-foreground">
          {t("common.home")}
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-foreground">
          {t("common.shop")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted">
            <div className="aspect-4/5">
              <ProductImage
                src={product.images[activeImage] ?? product.images[0]}
                alt={name}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {product.soldOut ? (
              <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-[2px]">
                <Badge variant="soldout" className="px-4 py-2 text-[11px]">
                  {t("product.soldOut")}
                </Badge>
              </div>
            ) : null}

            {/* Round buttons inside the photo, like the hero slider: tap the
                circle to move to the next / previous view. */}
            {product.images.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={t("product.previousPhoto")}
                  onClick={() => stepPhoto(-1)}
                  className={cn(
                    "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105",
                    isAr ? "right-3" : "left-3",
                  )}
                >
                  {isAr ? (
                    <ChevronRight className="size-5" />
                  ) : (
                    <ChevronLeft className="size-5" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={t("product.nextPhoto")}
                  onClick={() => stepPhoto(1)}
                  className={cn(
                    "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105",
                    isAr ? "left-3" : "right-3",
                  )}
                >
                  {isAr ? (
                    <ChevronLeft className="size-5" />
                  ) : (
                    <ChevronRight className="size-5" />
                  )}
                </button>
              </>
            ) : null}

            {/* The same round dots the hero slider shows at the bottom of its
                image — tap one to jump straight to that view. */}
            {product.images.length > 1 ? (
              <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center">
                <div className="flex items-center gap-2.5 rounded-full bg-black/35 px-3 py-1.5">
                  {product.images.map((image, index) => (
                    <button
                      key={image + index}
                      type="button"
                      aria-label={t("product.imageAlt", { n: index + 1 })}
                      aria-current={activeImage === index}
                      onClick={() => setActiveImage(index)}
                      className={cn(
                        "size-2.5 rounded-full transition-all duration-300",
                        activeImage === index
                          ? "scale-125 bg-white"
                          : "bg-white/40 hover:bg-white/70",
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {product.images.length > 1 || isAdmin ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image + index}
                  type="button"
                  aria-label={t("product.imageAlt", { n: index + 1 })}
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "relative size-20 overflow-hidden rounded-xl border transition-all",
                    activeImage === index
                      ? "border-foreground"
                      : "border-border/70 opacity-70 hover:opacity-100",
                  )}
                >
                  <ProductImage src={image} alt={name} sizes="80px" />
                  {/* A photo tied to a colour shows its swatch, so the colour
                      and the picture are never a mystery. */}
                  {product.imageColors?.[index] ? (
                    <span
                      className="absolute bottom-1 end-1 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-white"
                      title={colorLabel(product.imageColors[index]!, lang)}
                    >
                      <span
                        className="size-2 rounded-full border border-white/60"
                        style={{ background: colorSwatch(product.imageColors[index]!) }}
                      />
                      {colorLabel(product.imageColors[index]!, lang)}
                    </span>
                  ) : null}
                </button>
              ))}
              {/* Admin only: as many extra photos as the product needs. */}
              {isAdmin ? (
                <button
                  type="button"
                  aria-label={t("product.addPhoto")}
                  title={t("product.addPhoto")}
                  onClick={() => setPhotosOpen(true)}
                  className="text-muted-foreground hover:border-foreground hover:text-foreground grid size-20 place-items-center rounded-xl border border-dashed border-border transition-colors"
                >
                  <Plus className="size-5" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Info */}
        <div>
          <p
            className={cn(
              "text-muted-foreground text-[10px]",
              isAr ? "tracking-[0.08em]" : "tracking-[0.3em] uppercase",
            )}
          >
            {liveCategoryLabel(categoryRows, product.category, lang)}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {name}
            </h1>
            {/* Admin only: every value of this product, editable in place. */}
            <ProductPageEditButton product={product} />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-2xl font-semibold">{formatDA(product.price)}</span>
            {product.oldPrice ? (
              <span className="text-muted-foreground text-sm line-through">
                {formatDA(product.oldPrice)}
              </span>
            ) : null}
            {product.oldPrice ? (
              <Badge variant="muted">
                {t("product.save", {
                  amount: formatDA(product.oldPrice - product.price),
                })}
              </Badge>
            ) : null}
          </div>

          {/* Colors */}
          <div className="mt-8">
            <p className={headingClass}>{t("product.color")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {shopperColors(product).length === 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs">
                  <span
                    className="size-3.5 rounded-full border border-border"
                    style={{ background: colorSwatch(UNKNOWN_COLOR) }}
                  />
                  {t("product.unknownColor")}
                </span>
              ) : (
                shopperColors(product).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setColor(option);
                      const index = photoForColor(option);
                      if (index >= 0) setActiveImage(index);
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition-colors",
                      color === option
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
                ))
              )}
            </div>
          </div>

          {/* Sizes — filtered by the selected colour's stock */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className={headingClass}>{t("product.size")}</p>
              <span className="text-muted-foreground text-[11px]">
                {t("product.sizesAvailable", { n: selectableSizes.length })}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((item) => {
                const ok = sizeAvailable(item.label, item.available);
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled={!ok}
                    onClick={() => setSize(item.label)}
                    className={cn(
                      "relative min-w-14 overflow-hidden rounded-xl border px-4 py-2.5 text-sm transition-colors",
                      size === item.label
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/40",
                      !ok &&
                        "text-destructive border-destructive/50 cursor-not-allowed bg-destructive/5 hover:border-destructive/50",
                    )}
                  >
                    {sizeLabel(item.label, lang)}
                    {/* Unavailable size: a red diagonal slash across the whole
                        chip, not just a red colour. */}
                    {!ok ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden rounded-[inherit]"
                      >
                        <span className="bg-destructive block h-[2px] w-[180%] -rotate-[24deg]" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity stepper sits above the action buttons, centered */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-1 rounded-full border border-border px-2 py-1">
              <button
                type="button"
                aria-label={t("product.quantityMinus")}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid size-8 place-items-center rounded-full hover:bg-muted"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                type="button"
                aria-label={t("product.quantityPlus")}
                onClick={() => setQuantity((value) => value + 1)}
                className="grid size-8 place-items-center rounded-full hover:bg-muted"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Add to cart / buy now — one tight row */}
          <div className="mt-3 flex flex-nowrap items-center gap-2 sm:gap-3 sm:flex-wrap">
            <Button
              className="h-12 flex-1 px-3 text-xs sm:px-6 sm:text-sm"
              disabled={product.soldOut}
              onClick={() => handleAdd(false)}
            >
              {t("product.addToCart")}
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 px-3 text-xs sm:px-6 sm:text-sm"
              disabled={product.soldOut}
              onClick={() => handleAdd(true)}
            >
              {t("product.buyNow")}
            </Button>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border/70 p-4 text-xs sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <Truck className="size-4 shrink-0" />
              {t("product.delivery")}
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0" />
              {t("product.cod")}
            </span>
            <span className="flex items-center gap-2">
              <Ruler className="size-4 shrink-0" />
              {size
                ? t("product.yourSize", { size: sizeLabel(size, lang) })
                : t("product.sizeGuideHint")}
            </span>
          </div>
        </div>
      </div>

      {/* Related --------------------------------------------------------- */}
      {relatedProducts.length > 0 ? (
        <section className="mt-16">
          <SectionHeading
            eyebrow={t("product.relatedEyebrow")}
            title={t("product.related")}
          />
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {relatedProducts.map((item, index) => (
              <ProductCard key={item._id} product={item} index={index} />
            ))}
          </div>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/shop">
              {t("common.allProducts")}
              <ArrowLeft className={cn("size-4", !isAr && "rotate-180")} />
            </Link>
          </Button>
        </section>
      ) : null}

      {/* Photo manager behind the gallery's “＋” tile (admin only). */}
      <ProductImagesDialog
        open={photosOpen}
        onOpenChange={setPhotosOpen}
        product={product}
      />
    </div>
  );
}
