import { ShoppingBag } from "lucide-react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router";

import { api } from "@/convex/_generated/api";
import { ProductFormDialog } from "@/components/store/AddProductDialog";
import { Badge, CardActionsMenu, Price, ProductImage } from "@/components/store/bits";
import { pickLang, useI18n } from "@/lib/i18n";
import { categoryBySlug, categoryName, liveCategoryBySlug } from "@/lib/store-data";
import type { Product } from "@/lib/store-types";
import { cn } from "@/lib/utils";

/** The admin's 3-dot menu on a card — its edit option opens the popup. */
function ProductCardActions({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <CardActionsMenu
        productId={product._id}
        soldOut={product.soldOut}
        onEdit={() => setEditing(true)}
      />
      <ProductFormDialog
        open={editing}
        onOpenChange={setEditing}
        product={product}
        defaultCategory={product.category}
      />
    </>
  );
}

export function ProductCard({
  product,
  index = 0,
  imageAspect = "aspect-square",
}: {
  product: Product;
  index?: number;
  /** Photo shape — the home-page featured cards use a slightly shorter one. */
  imageAspect?: string;
}) {
  const categoryRows = useQuery(api.catalog.listCategories);
  const imageRef = useRef<HTMLDivElement>(null);
  const { t, lang, isAr } = useI18n();
  const category =
    liveCategoryBySlug(categoryRows, product.category) ??
    categoryBySlug(product.category);
  const available = product.sizes.filter((size) => size.available);
  const name = pickLang(product.nameAr, product.nameEn, lang);

  // Weak devices: skip entrance animation and hover zoom entirely.
  const lowPower =
    typeof navigator !== "undefined" &&
    (navigator.hardwareConcurrency ?? 8) <= 4 &&
    !window.matchMedia("(min-width: 1024px)").matches;

  return (
    <motion.article
      initial={lowPower ? false : { opacity: 0, y: 18 }}
      whileInView={lowPower ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-none border border-border/70 bg-card",
        !lowPower &&
          "transition-all duration-300 hover:shadow-[0_18px_50px_-26px_rgba(0,0,0,0.35)]",
      )}
    >
      <div
        ref={imageRef}
        className={cn("relative overflow-hidden bg-muted", imageAspect)}
      >
        <ProductCardActions product={product} />
        <Link to={`/product/${product._id}`} className="block h-full w-full">
          <ProductImage
            src={product.images[0]}
            alt={name}
            className={cn(
              "duration-700",
              !lowPower && "transition-transform group-hover:scale-[1.06]",
            )}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {/* Sold out keeps the first corner — red. */}
          <div className="flex flex-col gap-1.5">
            {product.soldOut ? (
              <Badge variant="soldout">{t("product.soldOut")}</Badge>
            ) : null}
          </div>
          {/* The sale word sits where the favourite heart used to be — green. */}
          {!product.soldOut && product.oldPrice ? (
            <Badge variant="promo">{t("product.promo")}</Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 p-2.5">
        {/* Category label opens the category page — never the product. */}
        {category ? (
          <Link
            to={`/category/${category.slug}`}
            className={cn(
              "text-muted-foreground hover:text-foreground truncate text-[10px] transition-colors",
              isAr ? "tracking-[0.14em]" : "tracking-[0.24em] uppercase",
            )}
          >
            {categoryName(category, lang)}
          </Link>
        ) : (
          <p
            className={cn(
              "text-muted-foreground truncate text-[10px]",
              isAr ? "tracking-[0.14em]" : "tracking-[0.24em] uppercase",
            )}
          >
            {product.category}
          </p>
        )}
        <Link to={`/product/${product._id}`}>
          <h3 className="mt-0.5 line-clamp-1 text-[13px] leading-5 font-semibold">
            {name}
          </h3>
        </Link>

        <div className="mt-0.5 flex items-end justify-between gap-2 border-t border-border/60 pt-1.5">
          <Price price={product.price} oldPrice={product.oldPrice} />
          <span className="text-muted-foreground shrink-0 text-[10px]">
            {available.length > 0
              ? t("product.sizesCount", { n: available.length })
              : "—"}
          </span>
        </div>

        {/* Single full-width action — goes to the product page */}
        <Link
          to={`/product/${product._id}`}
          className={cn(
            "bg-foreground text-background mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-none text-[11px] font-medium transition-opacity disabled:opacity-40",
            isAr ? "" : "tracking-[0.1em] uppercase",
          )}
          aria-disabled={product.soldOut}
        >
          <ShoppingBag className="size-4 shrink-0" />
          {t("product.buyNow")}
        </Link>
      </div>
    </motion.article>
  );
}
