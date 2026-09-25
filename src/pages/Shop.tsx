import { useQuery } from "convex/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n, type TKey } from "@/lib/i18n";
import { useStoreClock } from "@/hooks/use-store-clock";
import {
  categoryName,
  isHiddenFromStore,
  liveCategoryLabel,
  matchesSearch,
} from "@/lib/store-data";
import { cn } from "@/lib/utils";

const SORTS: { value: string; key: TKey }[] = [
  { value: "new", key: "shop.sortNew" },
  { value: "price-asc", key: "shop.sortPriceAsc" },
  { value: "price-desc", key: "shop.sortPriceDesc" },
];

export default function Shop() {
  const { t, lang } = useI18n();
  const products = useQuery(api.catalog.listProducts);
  const categoryRows = useQuery(api.catalog.listCategories);
  const categories = categoryRows ?? [];
  const [params, setParams] = useSearchParams();
  /* Sold-out cards leave the shop 24 hours after they were marked. */
  const now = useStoreClock();
  const [sort, setSort] = useState("new");
  const [query, setQuery] = useState(params.get("q") ?? "");

  const activeCategory = params.get("cat") ?? "";
  /** Live term: results follow what is typed, no need to press Enter. */
  const searchTerm = query.trim();

  /**
   * A search sent from the navbar lands here as `?q=…`. Syncing it into the
   * box means the results appear even when the shop page is already open —
   * otherwise the term was ignored until the page was reloaded.
   */
  const urlQuery = params.get("q") ?? "";
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setParams(next, { replace: true });
  }

  const filtered = useMemo(() => {
    const list = (products ?? []).filter((product) => {
      if (isHiddenFromStore(product, now)) return false;
      if (activeCategory && product.category !== activeCategory) return false;
      if (searchTerm) {
        /* Names in both languages plus the category in both languages, so a
           half-typed word in Arabic or in English still finds the product. */
        const haystack = [
          product.nameAr,
          product.nameEn,
          product.category,
          liveCategoryLabel(categoryRows, product.category, "ar"),
          liveCategoryLabel(categoryRows, product.category, "en"),
        ].join(" ");
        if (!matchesSearch(haystack, searchTerm)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return b.createdAt - a.createdAt;
    });
  }, [products, activeCategory, searchTerm, sort, now, categoryRows]);

  const loading = products === undefined;
  const category = categories.find(
    (item) => item.slug === activeCategory,
  );
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-2 text-xs transition-colors",
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border hover:border-foreground/40",
    );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-muted-foreground flex items-center gap-2 text-xs">
        <Link to="/" className="hover:text-foreground">
          {t("common.home")}
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {category ? categoryName(category, lang) : t("common.allProducts")}
        </span>
      </nav>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-6 border-b border-border/70 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {category ? categoryName(category, lang) : t("common.shop")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("shop.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              updateParam("q", query.trim() || null);
            }}
            className="flex items-center gap-2 rounded-full border border-border px-3"
          >
            <Search className="text-muted-foreground size-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("shop.searchPlaceholder")}
              aria-label={t("common.search")}
              className="h-9 w-36 bg-transparent text-sm outline-none sm:w-52"
            />
          </form>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44">
              <SlidersHorizontal className="size-4" />
              <SelectValue placeholder={t("shop.sort")} />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => updateParam("cat", null)}
          className={chip(!activeCategory)}
        >
          {t("shop.all")}
        </button>
        {categories.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() =>
              updateParam("cat", activeCategory === item.slug ? null : item.slug)
            }
            className={chip(activeCategory === item.slug)}
          >
            {categoryName(item, lang)}
          </button>
        ))}
        {searchTerm ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setQuery("");
              updateParam("q", null);
            }}
          >
            <X className="size-3.5" />
            {searchTerm}
          </Button>
        ) : null}
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        {loading ? "…" : t("shop.count", { n: filtered.length })}
      </p>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-none" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-none border border-dashed border-border py-20 text-center">
          <p className="text-sm font-medium">{t("shop.emptyTitle")}</p>
          <p className="text-muted-foreground max-w-sm text-xs leading-6">
            {t("shop.emptyBody")}
          </p>
          <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
            {t("common.reset")}
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {filtered.map((product, index) => (
            <ProductCard key={product._id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
