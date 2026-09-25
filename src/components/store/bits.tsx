import {
  Languages,
  MoreHorizontal,
  PackageCheck,
  PackageX,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMutation } from "convex/react";
import {
  useEffect,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { useStoreBrand } from "@/hooks/use-store-brand";
import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatDA } from "@/lib/store-data";

/* ------------------------------------------------------------------ */
/* Brand mark — square HA logo (Man's Fashion · Boutique Boys)         */
/* ------------------------------------------------------------------ */

export function HaMonogram({ className }: { className?: string }) {
  /* The admin can swap the logo — every place it appears follows along. */
  const { logo } = useStoreBrand();
  return (
    <img
      src={logo}
      alt="HA Drip Boys — Man's Fashion · Boutique Boys"
      className={cn("size-9 object-contain", className)}
    />
  );
}

export function Brand({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
  compact?: boolean;
}) {
  /* Same live logo the admin edits from the site. */
  const { logo } = useStoreBrand();
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logo}
        alt="HA Drip Boys — Man's Fashion · Boutique Boys"
        className={cn(
          "size-9 object-contain",
          onDark && "size-10 rounded-md bg-white p-0.5",
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card actions — 3-dot menu linked to the admin dashboard             */
/* ------------------------------------------------------------------ */

/** Instagram glyph with the real brand gradient (purple → pink → orange). */
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ig-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFD600" />
          <stop offset="35%" stopColor="#FF7A00" />
          <stop offset="60%" stopColor="#FF0069" />
          <stop offset="90%" stopColor="#7638FA" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" stroke="url(#ig-gradient)" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="url(#ig-gradient)" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" stroke="url(#ig-gradient)" />
    </svg>
  );
}

/** WhatsApp glyph in its official green — taps open the chat straight away. */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.115-.198.057-.371-.029-.52-.086-.148-.66-1.59-.905-2.175-.238-.571-.48-.494-.66-.503l-.561-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
      />
    </svg>
  );
}

/** Facebook glyph in its official blue. */
export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z"
      />
    </svg>
  );
}

/**
 * True only inside a browser tab where the admin dashboard session is active.
 * Shared with Admin.tsx via the same sessionStorage key.
 */
export function isAdminSession(): boolean {
  try {
    return window.sessionStorage.getItem("hadrip-admin-session") === "1";
  } catch {
    return false;
  }
}

/** React hook variant — re-checks when the tab regains focus. */
export function useIsAdminSession(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const sync = () => setIsAdmin(isAdminSession());
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return isAdmin;
}

export function CardActionsMenu({
  productId,
  tab = "products",
  soldOut = false,
  onEdit,
}: {
  /** The real database id — the delete mutation needs it, not a slug. */
  productId: string;
  tab?: "products" | "categories";
  /** Current stock flag, so the option reads the opposite of what is shown. */
  soldOut?: boolean;
  /** Opens the edit popup right here instead of hopping to the dashboard. */
  onEdit?: () => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const deleteProduct = useMutation(api.catalog.deleteProduct);
  const deleteCategory = useMutation(api.catalog.deleteCategory);
  const setProductSoldOut = useMutation(api.catalog.setProductSoldOut);

  /** One tap flips the stock flag — cards and the product page update live. */
  async function toggleSoldOut() {
    setBusy(true);
    try {
      await setProductSoldOut({
        adminKey: ADMIN_API_KEY,
        id: productId as never,
        soldOut: !soldOut,
      });
      toast.success(soldOut ? t("card.markedAvailable") : t("card.markedSoldOut"));
      setOpen(false);
    } catch {
      toast.error(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  /** Deletes right here — no dashboard hop. */
  async function handleDelete() {
    setBusy(true);
    try {
      if (tab === "categories") {
        await deleteCategory({ adminKey: ADMIN_API_KEY, id: productId as never });
      } else {
        await deleteProduct({ adminKey: ADMIN_API_KEY, id: productId as never });
      }
      toast.success(t("admin.deleted"));
      setOpen(false);
      setConfirming(false);
    } catch {
      toast.error(t("admin.deleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  /**
   * Opens the menu. Used by the mouse click and by the phone tap: blocking a
   * tap's default also cancels the click, so the touch handler must open the
   * menu itself or nothing happens on phones.
   */
  function openActions(event: SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }

  /** Only the signed-in admin ever sees this menu. */
  const isAdmin = useIsAdminSession();
  if (!isAdmin) return null;

  return (
    <>
      {/* Plain button (not inside the card Link) so tapping it never navigates. */}
      <button
        type="button"
        aria-label={t("card.actions")}
        className="bg-background/85 text-foreground pointer-events-auto absolute top-3 start-3 z-30 grid size-8 place-items-center rounded-none border border-border/70 shadow-sm transition-colors hover:bg-background"
        onClick={openActions}
        onTouchEnd={openActions}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {/* Options open as a centred sheet — dead-centre of the screen. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-[260px] gap-0 rounded-none p-2 sm:rounded-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t("card.actions")}</DialogTitle>
            <DialogDescription>{t("card.actions")}</DialogDescription>
          </DialogHeader>
          {confirming ? (
            <div className="p-4 text-center">
              <p className="text-sm font-medium">
                {tab === "categories"
                  ? t("admin.deleteCategoryConfirm")
                  : t("admin.deleteProductConfirm")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-9"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  {t("admin.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  className="h-9"
                  disabled={busy}
                  onClick={() => void handleDelete()}
                >
                  {t("admin.delete")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Products only: quick stock switch, no dashboard hop. */}
              {tab === "products" ? (
                <button
                  type="button"
                  disabled={busy}
                  className="hover:bg-muted flex w-full items-center gap-3 px-3 py-3 text-start text-sm transition-colors disabled:opacity-50"
                  onClick={() => void toggleSoldOut()}
                >
                  {soldOut ? (
                    <PackageCheck className="size-4 shrink-0" />
                  ) : (
                    <PackageX className="size-4 shrink-0" />
                  )}
                  {soldOut ? t("card.markAvailable") : t("card.markSoldOut")}
                </button>
              ) : null}
              <button
                type="button"
                className="hover:bg-muted flex w-full items-center gap-3 px-3 py-3 text-start text-sm transition-colors"
                onClick={() => {
                  setOpen(false);
                  // The card passes an inline editor; without one we fall back
                  // to the dashboard form.
                  if (onEdit) onEdit();
                  else navigate(`/admin?tab=${tab}&edit=${productId}`);
                }}
              >
                <Pencil className="size-4 shrink-0" />
                {tab === "categories" ? t("card.editCategory") : t("card.edit")}
              </button>
              <button
                type="button"
                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 px-3 py-3 text-start text-sm transition-colors"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-4 shrink-0" />
                {tab === "categories" ? t("card.deleteCategory") : t("card.delete")}
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Language switch (AR ⇄ EN)                                          */
/* ------------------------------------------------------------------ */

const LANGS: { code: Lang; label: string }[] = [
  { code: "ar", label: "ع" },
  { code: "en", label: "EN" },
];

/** Compact segmented AR / EN control, placed in the header and the dashboard. */
export function LanguageToggle({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      title={t("common.language")}
      className={cn(
        "flex items-center gap-0.5 rounded-full border p-0.5",
        onDark ? "border-white/20" : "border-border",
        className,
      )}
    >
      <Languages
        aria-hidden="true"
        className={cn(
          "ms-1.5 me-0.5 size-3.5 shrink-0",
          onDark ? "text-white/45" : "text-muted-foreground",
        )}
      />
      {LANGS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLang(option.code)}
          aria-pressed={lang === option.code}
          className={cn(
            "grid h-6 min-w-8 place-items-center rounded-full px-2 text-[11px] font-semibold tracking-wide transition-colors",
            lang === option.code
              ? onDark
                ? "bg-white text-black"
                : "bg-foreground text-background"
              : onDark
                ? "text-white/60 hover:text-white"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product imagery with monogram fallback                             */
/* ------------------------------------------------------------------ */

export function ProductImage({
  src,
  alt,
  className,
  sizes,
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f4f4f3,#dcdcda)]",
          className,
        )}
      >
        <HaMonogram className="size-10 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      sizes={sizes}
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Typography helpers                                                  */
/* ------------------------------------------------------------------ */

export function Price({
  price,
  oldPrice,
  className,
}: {
  price: number;
  oldPrice?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-[15px] font-semibold tracking-[0.04em]">
        {formatDA(price)}
      </span>
      {oldPrice ? (
        <span className="text-muted-foreground text-xs line-through">
          {formatDA(oldPrice)}
        </span>
      ) : null}
    </div>
  );
}

export function SectionHeading({
  title,
  eyebrow,
  action,
  center = false,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  /** Editorial centred layout used on the home page. */
  center?: boolean;
  className?: string;
}) {
  const { isAr } = useI18n();

  if (center) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center gap-3 text-center",
          className,
        )}
      >
        {eyebrow ? (
          <p
            className={cn(
              "text-muted-foreground font-display text-[11px]",
              isAr ? "tracking-[0.2em]" : "tracking-[0.42em] uppercase",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-[30px] leading-tight font-normal tracking-[0.02em] sm:text-[40px]">
          {title}
        </h2>
        <span className="bg-foreground/25 h-px w-16" />
        {/* Admin's ＋ floats at the far edge — it never shifts the heading. */}
        {action ? (
          <div className="absolute inset-y-0 end-0 flex items-center justify-center">
            {action}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-5",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p
            className={cn(
              "text-muted-foreground text-[10px]",
              isAr ? "tracking-[0.2em]" : "tracking-[0.34em] uppercase",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  variant = "solid",
  className,
}: {
  children: ReactNode;
  /** "promo" = green sale tag, "soldout" = red stock tag. */
  variant?: "solid" | "outline" | "muted" | "promo" | "soldout";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] uppercase",
        variant === "solid" && "bg-foreground text-background",
        variant === "promo" && "bg-emerald-600 text-white",
        variant === "soldout" && "bg-red-600 text-white",
        variant === "outline" && "border border-border text-foreground",
        variant === "muted" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
