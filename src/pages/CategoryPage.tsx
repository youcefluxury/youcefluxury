import { useQuery } from "convex/react";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router";

import { api } from "@/convex/_generated/api";
import { AddProductButton } from "@/components/store/AddProductDialog";
import { CategoryEditButton } from "@/components/store/AdminEdit";
import { ProductImage, SectionHeading } from "@/components/store/bits";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useStoreClock } from "@/hooks/use-store-clock";
import { categoryName, isHiddenFromStore } from "@/lib/store-data";
import { cn } from "@/lib/utils";

/**
 * Category page — the destination of every category card on the storefront.
 * It never opens a product: it lists all the pieces that belong to the
 * category the shopper tapped (shoes → only the shoes, and so on).
 */
/** Fisher–Yates: a fresh random order every time the page is opened. */
function shuffled(images: string[]): string[] {
  const list = [...images];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, isAr } = useI18n();
  const products = useQuery(api.catalog.listProducts);
  const categoryRows = useQuery(api.catalog.listCategories);
  const rows = categoryRows ?? [];
  /* Sold-out cards leave the category page 24 hours after they were marked. */
  const now = useStoreClock();

  // The link may carry the slug or the database id — accept both.
  const category = rows.find((row) => row.slug === slug || row._id === slug);

  /**
   * Products store their category as the slug. Older rows may still carry the
   * id or a name, so every identifier of this category is accepted.
   */
  const keys = useMemo(() => {
    if (!category) return new Set<string>();
    return new Set(
      [category.slug, category._id, category.nameAr, category.nameEn]
        .filter(Boolean)
        .map((value) => value.trim().toLowerCase()),
    );
  }, [category]);

  const items = useMemo(() => {
    const list = (products ?? []).filter(
      (product) =>
        !isHiddenFromStore(product, now) &&
        keys.has((product.category ?? "").trim().toLowerCase()),
    );
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [products, keys, now]);

  /**
   * The photos shown at the bottom of the page come straight from the images
   * of this category's products — nothing extra to upload — and are shuffled
   * for every visit. Computed before any early return so the hook count never
   * changes between renders.
   */
  const galleryKey = useMemo(() => {
    const urls = new Set<string>();
    for (const product of items) {
      for (const image of product.images) {
        const url = image?.trim();
        if (url) urls.add(url);
      }
    }
    return [...urls].join("|");
  }, [items]);

  const gallery = useMemo(
    () => shuffled(galleryKey ? galleryKey.split("|") : []),
    [galleryKey],
  );

  const others = rows.filter((row) => row._id !== category?._id);
  const loading = products === undefined || categoryRows === undefined;

  const backArrow = (
    <ArrowLeft className={cn("size-4", !isAr && "rotate-180")} />
  );

  /* Loading ---------------------------------------------------------- */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="h-64 rounded-none sm:h-80" />
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  /* Unknown / deleted category --------------------------------------- */
  if (!category) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
        <LayoutGrid className="text-muted-foreground size-8" />
        <p className="text-lg font-semibold">{t("category.notFound")}</p>
        <p className="text-muted-foreground max-w-sm text-xs leading-6">
          {t("category.notFoundBody")}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/shop">{t("common.allProducts")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">{t("common.home")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const name = categoryName(category, lang);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      {/* Breadcrumb ---------------------------------------------------- */}
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

      {/* Category banner ---------------------------------------------- */}
      <header className="relative mt-6 h-60 overflow-hidden border border-border/70 bg-ink sm:h-80">
        <ProductImage
          src={category.image}
          alt={name}
          sizes="100vw"
          className="scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 text-white sm:p-8">
          <div>
            <p
              className={cn(
                "text-[10px] text-white/70",
                isAr ? "tracking-[0.2em]" : "tracking-[0.34em] uppercase",
              )}
            >
              {t("category.eyebrow")}
            </p>
            <h1 className="font-display mt-2 text-2xl leading-tight tracking-[0.02em] sm:text-4xl">
              {name}
            </h1>
            <p className="mt-2 text-[11px] text-white/75">
              {t("category.products", { n: items.length })}
            </p>
          </div>
          <Link
            to="/shop"
            className={cn(
              "inline-flex h-10 items-center gap-2 border border-white/60 px-4 text-white transition-colors hover:bg-white hover:text-black",
              isAr ? "text-[12px]" : "font-display text-[10px] tracking-[0.24em] uppercase",
            )}
          >
            {t("common.allProducts")}
            {backArrow}
          </Link>
        </div>
      </header>

      {/* Products of this category only -------------------------------- */}
      <section className="mt-10">
        <SectionHeading
          eyebrow={t("category.eyebrow")}
          title={name}
          action={
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs">
                {t("category.products", { n: items.length })}
              </p>
              {/* Admin only: add a product or edit this category in place. */}
              <AddProductButton categorySlug={category.slug} />
              <CategoryEditButton category={category} tone="dark" />
            </div>
          }
        />

        {items.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 border border-dashed border-border py-20 text-center">
            <LayoutGrid className="text-muted-foreground size-7" />
            <p className="text-sm font-medium">{t("category.emptyTitle")}</p>
            <p className="text-muted-foreground max-w-sm text-xs leading-6">
              {t("category.emptyBody")}
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/shop">{t("common.allProducts")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {items.map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Photos inside this category — random order for every visitor ----- */}
      {gallery.length > 0 ? (
        <section className="mt-16 border-t border-border/70 pt-10">
          <SectionHeading
            eyebrow={t("category.galleryEyebrow")}
            title={t("category.galleryTitle")}
            action={
              <p className="text-muted-foreground max-w-xs text-xs leading-6">
                {t("category.galleryLead")}
              </p>
            }
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {gallery.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="group relative aspect-square overflow-hidden border border-border/70 bg-muted"
              >
                <ProductImage
                  src={image}
                  alt={`${name} — ${index + 1}`}
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Other categories ---------------------------------------------- */}
      {others.length > 0 ? (
        <section className="mt-16 border-t border-border/70 pt-10">
          <SectionHeading title={t("category.otherTitle")} />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((row) => (
              <Link
                key={row._id}
                to={`/category/${row.slug}`}
                className="group relative block h-40 overflow-hidden border border-border/70 bg-muted"
              >
                <ProductImage
                  src={row.image}
                  alt={categoryName(row, lang)}
                  className="transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold text-white">
                  {categoryName(row, lang)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
