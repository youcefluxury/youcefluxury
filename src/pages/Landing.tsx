import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { api } from "@/convex/_generated/api";
import { CategoryEditDialog } from "@/components/store/AdminEdit";
import { AddCategoryButton } from "@/components/store/CategoryFormDialog";
import { ProductFormDialog } from "@/components/store/AddProductDialog";
import {
  CardActionsMenu,
  ProductImage,
  SectionHeading,
  useIsAdminSession,
} from "@/components/store/bits";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSlider } from "@/components/store/HeroSlider";
import { ProductCard } from "@/components/store/ProductCard";
import { useStoreBrand } from "@/hooks/use-store-brand";
import { useStoreClock } from "@/hooks/use-store-clock";
import { useI18n } from "@/lib/i18n";
import { categoryName, isHiddenFromStore } from "@/lib/store-data";
import { cn } from "@/lib/utils";

/**
 * Featured products grid: one full-width card per row below the desktop width
 * (the photo inside is a touch shorter than square), and the original
 * four-in-a-row layout from 1024px up.
 */
const FEATURED_GRID = "mt-7 grid grid-cols-1 gap-5 lg:grid-cols-4";

/** Slightly shorter than the default square photo — keeps the card compact. */
const FEATURED_ASPECT = "aspect-[6/5]";

/** How many featured cards show before the “عرض المزيد” button appears. */
const FEATURED_LIMIT = 10;

/** A live category row straight from the database. */
type CategoryRow = {
  _id: string;
  slug: string;
  image: string;
  sizes: string[];
  hasSizeGuide: boolean;
};

/** The admin's 3-dot menu on a home-page category card (edits in place). */
function CategoryCardActions({ category }: { category: CategoryRow }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CardActionsMenu
        productId={category._id}
        tab="categories"
        onEdit={() => setOpen(true)}
      />
      <CategoryEditDialog open={open} onOpenChange={setOpen} category={category} />
    </>
  );
}

/**
 * Admin-only ＋ next to “منتجاتنا المميزة”: opens the dashboard product form
 * as a popup (any category can still be picked inside it).
 */
function AddFeaturedProductButton() {
  const { t } = useI18n();
  const isAdmin = useIsAdminSession();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("addProduct.open")}
        title={t("addProduct.open")}
        onClick={() => setOpen(true)}
        className="border-foreground bg-foreground text-background hover:opacity-80 grid size-7 shrink-0 place-items-center rounded-full border transition-opacity"
      >
        <Plus className="size-4" />
      </button>
      <ProductFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export default function Landing() {
  const { t, lang, isAr } = useI18n();
  const isAdmin = useIsAdminSession();
  // Live shop location — the dashboard can move the pin any time.
  const { mapEmbedUrl } = useStoreBrand();
  const products = useQuery(api.catalog.listProducts);
  const categoryRows = useQuery(api.catalog.listCategories);
  const categories = categoryRows ?? [];
  const categoriesLoading = categoryRows === undefined;
  const list = products ?? [];
  const loading = products === undefined;
  /* Sold-out cards leave the home page 24 hours after they were marked. */
  const now = useStoreClock();
  const allFeatured = [...list]
    .filter((product) => !isHiddenFromStore(product, now))
    .sort((a, b) => Number(b.featured) - Number(a.featured));
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const featured = showAllFeatured
    ? allFeatured
    : allFeatured.slice(0, FEATURED_LIMIT);
  const featuredMore = allFeatured.length - FEATURED_LIMIT;

  const arrow = (className = "size-3.5") => (
    <ArrowLeft className={cn(className, !isAr && "rotate-180")} />
  );

  /** Weak devices (few CPU cores, small screen) skip entrance animations. */
  const lowPower =
    typeof navigator !== "undefined" &&
    (navigator.hardwareConcurrency ?? 8) <= 4 &&
    !window.matchMedia("(min-width: 1024px)").matches;

  return (
    <div className="pb-4">
      {/* Hero slide ----------------------------------------------------- */}
      <HeroSlider />

      {/* Categories — always the live dashboard rows, so a delete here is a
          delete on the storefront too. ---------------------------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-7 pb-12 sm:px-6 sm:pt-8 lg:pt-10 lg:pb-14">
        <SectionHeading
          center
          title={t("home.categoriesTitle")}
          action={<AddCategoryButton />}
        />

        {categoriesLoading ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-none sm:h-64" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground mt-7 rounded-none border border-dashed border-border py-16 text-center text-xs">
            {isAdmin
              ? t("admin.noCategories")
              : isAr
                ? "التصنيفات قادمة قريباً"
                : "Categories coming soon"}
          </p>
        ) : (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={lowPower ? false : { opacity: 0, y: 18 }}
                whileInView={lowPower ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className={cn(
                  "relative",
                  index === 0 ? "lg:col-span-2" : "",
                )}
              >
                <CategoryCardActions category={category} />
                {/* Opens the category page — every card of that category only. */}
                <Link
                  to={`/category/${category.slug}`}
                  className="group relative block h-56 overflow-hidden rounded-none border border-border/70 bg-muted sm:h-64"
                >
                  <ProductImage
                    src={category.image}
                    alt={categoryName(category, lang)}
                    className="transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                    <p className="text-lg font-semibold">
                      {categoryName(category, lang)}
                    </p>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-white group-hover:text-black">
                      {arrow("size-4")}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Featured products -------------------------------------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6">
        <SectionHeading
          center
          title={t("home.productsTitle")}
          action={<AddFeaturedProductButton />}
        />

        {loading ? (
          /* One full-width card per row below the desktop width. */
          <div className={FEATURED_GRID}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className={FEATURED_GRID}>
              {featured.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                  imageAspect={FEATURED_ASPECT}
                />
              ))}
            </div>
            {featuredMore > 0 && !showAllFeatured ? (
              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllFeatured(true)}
                  className="border-foreground text-foreground hover:bg-foreground hover:text-background inline-flex h-11 items-center gap-2 border px-8 text-xs font-medium tracking-wide transition-colors"
                >
                  {t("common.showMore")}
                  <ChevronDown className="size-4" />
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Store location ------------------------------------------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6">
        <SectionHeading center title={t("home.map.title")} />
        <div className="mt-7 overflow-hidden rounded-none border border-border/70 bg-card">
          <iframe
            title={t("home.map.title")}
            /* Whatever the dashboard saved as the shop's location. */
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[320px] w-full sm:h-[420px]"
          />
        </div>
      </section>
    </div>
  );
}
