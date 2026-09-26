import {
  ChevronDown,
  Menu,
  Palette,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { api } from "@/convex/_generated/api";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  Brand,
  LanguageToggle,
  ProductImage,
  useIsAdminSession,
} from "@/components/store/bits";
import { AdminNotifications } from "@/components/store/AdminNotifications";
import {
  FacebookEditButton,
  InstagramEditButton,
  LogoEditButton,
  WhatsAppEditButton,
} from "@/components/store/AdminEdit";
import { useStoreBrand } from "@/hooks/use-store-brand";
import { useStorePhone } from "@/hooks/use-store-phone";
import { pickLang, useI18n } from "@/lib/i18n";
import {
  categoryName,
  formatDA,
  matchesSearch,
  whatsappLink,
} from "@/lib/store-data";
import { useCart } from "@/lib/store-state";
import { cn } from "@/lib/utils";

/** Black announcement bar: delivery note, in the active language only. */
function AnnouncementBar() {
  const { t, isAr } = useI18n();

  return (
    <div className="bg-ink text-white">
      <div className="mx-auto flex min-h-9 w-full max-w-7xl items-center justify-center gap-2 px-3 py-1 text-center">
        <span aria-hidden="true" className="text-[13px] leading-none">
          🇩🇿
        </span>
        <p
          className={cn(
            /* Wraps instead of overflowing on narrow phones. */
            "text-[10px] leading-snug sm:text-[12px]",
            isAr ? "tracking-[0.04em]" : "tracking-[0.14em]",
          )}
        >
          {t("common.deliveryNote")}
        </p>
        {/* Colour delivery truck — the left-hand mark of the note. */}
        <span aria-hidden="true" className="shrink-0 text-[13px] leading-none">
          🚚
        </span>
      </div>
    </div>
  );
}

export function StoreHeader() {
  const { t, lang, isAr } = useI18n();
  const navigate = useNavigate();
  const { count, openCart } = useCart();
  /* The dashboard shortcut in the navbar belongs to the signed-in admin only. */
  const isAdmin = useIsAdminSession();
  /* Live logo + social links — the admin edits all of them from the site. */
  const { instagram, facebook, name } = useStoreBrand();
  /* Live number: the WhatsApp icon chats with it straight away. */
  const { phone } = useStorePhone();
  const [mobileSearch, setMobileSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Live category list — admin edits appear here immediately.
  const categoryRows = useQuery(api.catalog.listCategories);
  const categories = categoryRows ?? [];
  const products = useQuery(api.catalog.listProducts);

  /**
   * Live suggestions: matching products appear under the box from the first
   * letters typed, in Arabic or English, with half-words included.
   */
  const suggestions = useMemo(() => {
    const term = query.trim();
    if (!term) return [];
    return (products ?? [])
      .filter((product) =>
        matchesSearch(
          `${product.nameAr} ${product.nameEn} ${product.category}`,
          term,
        ),
      )
      .slice(0, 5);
  }, [products, query]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
    setMobileSearch(false);
    setMenuOpen(false);
  }

  /** Rows shared by the desktop and the phone suggestion panels. */
  function renderSuggestions() {
    if (!query.trim()) return null;
    return (
      <div className="bg-card absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border shadow-lg">
        {suggestions.length === 0 ? (
          <p className="text-muted-foreground px-4 py-3 text-[11px]">
            {t("shop.emptyTitle")}
          </p>
        ) : (
          suggestions.map((product) => (
            <button
              key={product._id}
              type="button"
              onClick={() => {
                setQuery("");
                setMobileSearch(false);
                setMenuOpen(false);
                navigate(`/product/${product._id}`);
              }}
              className="hover:bg-muted flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-start last:border-b-0"
            >
              <span className="size-10 shrink-0 overflow-hidden rounded bg-muted">
                <ProductImage src={product.images[0]} alt="" sizes="40px" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs">
                {pickLang(product.nameAr, product.nameEn, lang)}
              </span>
              <span className="shrink-0 text-[11px] font-medium">
                {formatDA(product.price)}
              </span>
            </button>
          ))
        )}
      </div>
    );
  }

  /* size-9 on phones keeps the extra social icons inside the bar. */
  const iconButton =
    "grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground sm:size-10";

  const navLinks = [
    { to: "/", label: t("common.home") },
    { to: "/shop", label: t("common.shop") },
    { to: "/delivery", label: t("common.deliveryPrices") },
  ];

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      <div className="bg-background/85 border-b border-border/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
          <div className="relative shrink-0">
            <Link to="/" aria-label={name}>
              <Brand responsive />
            </Link>
            {/* Admin only: swap the logo from here. */}
            <LogoEditButton className="absolute -top-1 -start-1" />
          </div>

          <nav className="hidden shrink-0 items-center gap-5 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[12px] font-medium tracking-[0.08em] transition-colors hover:text-muted-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 text-[12px] font-medium tracking-[0.08em]"
              >
                {t("common.categories")}
                <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible absolute start-0 top-full z-50 w-72 translate-y-2 rounded-2xl border border-border/70 bg-popover p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/category/${category.slug}`}
                    className="hover:bg-muted flex items-center rounded-xl px-3 py-2.5 text-sm transition-colors"
                  >
                    {categoryName(category, lang)}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Centred search field — matching products show up as you type. */}
          <div className="relative mx-auto hidden w-full max-w-lg lg:block">
            <form
              onSubmit={submitSearch}
              role="search"
              className="flex h-11 items-stretch overflow-hidden rounded-md border border-border bg-card"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("common.searchPlaceholder")}
                aria-label={t("common.search")}
                className={cn(
                  "h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground",
                  !isAr && "text-start",
                )}
              />
              <button
                type="submit"
                aria-label={t("common.search")}
                className="hover:bg-muted grid h-full w-14 shrink-0 place-items-center border-s border-border transition-colors"
              >
                <Search className="size-4" />
              </button>
            </form>
            {renderSuggestions()}
          </div>

          <div className="ms-auto flex shrink-0 items-center gap-0 sm:gap-1">
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>

            <button
              type="button"
              aria-label={t("common.search")}
              onClick={() => setMobileSearch((open) => !open)}
              className={cn(iconButton, "md:hidden")}
            >
              {mobileSearch ? <X className="size-5" /> : <Search className="size-5" />}
            </button>

            <span className="relative">
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                aria-label={t("common.instagram")}
                className={iconButton}
              >
                <InstagramIcon className="size-5" />
              </a>
              {/* Admin only: edit the Instagram link from here. */}
              <InstagramEditButton className="absolute -bottom-1 -start-1" />
            </span>

            <span className="relative">
              {/* Opens the shop's WhatsApp chat directly — no forms in between. */}
              <a
                href={whatsappLink(undefined, phone)}
                target="_blank"
                rel="noreferrer"
                aria-label={t("common.whatsappAria")}
                className={iconButton}
              >
                <WhatsAppIcon className="size-5" />
              </a>
              {/* Admin only: change the number behind the icon. */}
              <WhatsAppEditButton className="absolute -bottom-1 -start-1" />
            </span>

            <span className="relative">
              <a
                href={facebook}
                target="_blank"
                rel="noreferrer"
                aria-label={t("common.facebook")}
                className={iconButton}
              >
                <FacebookIcon className="size-5" />
              </a>
              {/* Admin only: edit the Facebook link from here. */}
              <FacebookEditButton className="absolute -bottom-1 -start-1" />
            </span>

            {/* Admin only: live order notifications with the red counter. */}
            <AdminNotifications />

            {isAdmin ? (
              <>
                {/* Admin only: jump straight to the site design screen. */}
                <Link
                  to="/admin/design"
                  aria-label={t("admin.tabDesign")}
                  title={t("admin.tabDesign")}
                  className={iconButton}
                >
                  <Palette className="size-5" />
                </Link>
                <Link
                  to="/admin"
                  aria-label={t("common.account")}
                  className={iconButton}
                >
                  <User className="size-5" />
                </Link>
              </>
            ) : null}

            <button
              type="button"
              id="cart-anchor"
              onClick={openCart}
              aria-label={t("common.cart")}
              className={cn(iconButton, "relative")}
            >
              <ShoppingCart className="size-5" />
              <span
                key={count}
                className={cn(
                  "absolute -top-0.5 -end-0.5 grid min-w-5 animate-[cart-pop_0.35s_ease-out] place-items-center rounded-full px-1 text-[10px] font-semibold",
                  count > 0
                    ? "bg-ink text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>

            <button
              type="button"
              aria-label={t("common.menu")}
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(iconButton, "lg:hidden")}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileSearch ? (
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-4 lg:hidden">
            <form onSubmit={submitSearch}>
              <div className="flex h-11 items-stretch overflow-hidden rounded-md border border-border bg-card">
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("common.searchPlaceholder")}
                  aria-label={t("common.search")}
                  className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  aria-label={t("common.search")}
                  className="hover:bg-muted grid h-full w-14 shrink-0 place-items-center border-s border-border"
                >
                  <Search className="size-4" />
                </button>
              </div>
            </form>
            {renderSuggestions()}
          </div>
        ) : null}
      </div>

      {menuOpen ? (
        <div className="bg-background border-b border-border/70 px-4 pb-5 shadow-sm lg:hidden">
          <nav className="grid gap-1 pt-4">
            <div className="sm:hidden">
              <LanguageToggle />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="hover:bg-muted rounded-xl px-3 py-3 text-sm"
              >
                {link.label}
              </Link>
            ))}
            <p
              className={cn(
                "text-muted-foreground mt-3 px-3 text-[10px]",
                isAr ? "tracking-[0.2em]" : "tracking-[0.3em] uppercase",
              )}
            >
              {t("common.categories")}
            </p>
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/category/${category.slug}`}
                onClick={() => setMenuOpen(false)}
                className="hover:bg-muted rounded-xl px-3 py-2.5 text-sm"
              >
                {categoryName(category, lang)}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
