import { useMutation, useQuery } from "convex/react";
import {
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  HardDrive,
  Image as ImageIcon,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Palette,
  Phone,
  Pencil,
  Plus,
  Receipt,
  Search,
  Shapes,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Brand, HaMonogram, LanguageToggle, ProductImage } from "@/components/store/bits";
import { SiteDesignTab } from "@/components/store/SiteDesignTab";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_API_KEY, ADMIN_SESSION_KEY } from "@/lib/admin-key";
import { pickLang, useI18n, type Lang } from "@/lib/i18n";
import { useUploadImage } from "@/lib/upload";
import {
  COLOR_KEYS,
  ORDER_STATUSES,
  STORE,
  categoryName,
  colorLabel,
  colorSwatch,
  formatDA,
  liveCategoryLabel,
  liveCategories,
  orderStatusLabel,
  paymentLabel,
  sizeLabel,
  wilayaName,
} from "@/lib/store-data";
import type { Category } from "@/lib/store-data";
import type { Product } from "@/lib/store-types";
import { cn } from "@/lib/utils";

const EMPTY_PRODUCT_FORM = {
  /** The only name field left — it is mirrored to the English slot on save. */
  nameAr: "",
  price: "",
  oldPrice: "",
  /** Empty → the product form defaults to the first live category. */
  category: "",
  images: "",
  availableSizes: "",
  soldOutSizes: "",
  colors: "",
  /** Sizes sold out per colour — keyed by colour key. */
  colorStock: {} as Record<string, string[]>,
  /**
   * No description field on the form any more. The value is still carried
   * through untouched so editing a product never erases an older description.
   */
  descriptionAr: "",
  /** Featured products lead the home page, so a new product starts featured. */
  featured: true,
  soldOut: false,
};

type ProductFormState = typeof EMPTY_PRODUCT_FORM;

/* Standard size catalogue offered as tappable chips in the product form. */
const SIZE_LETTERS = ["S", "M", "L", "XL", "XXL", "3XL", "ONE SIZE"];
const SIZE_NUMBERS = Array.from({ length: 19 }, (_, index) => String(28 + index));

/**
 * Sizes are picked exactly like colours: one row of tappable icon chips, no
 * typing anywhere. Sizes already on the product that are not in the standard
 * list are appended to the row, so editing never drops them silently.
 */
function SizePicker({
  label,
  hint,
  selected,
  soldOut,
  summary,
  lang,
  onToggle,
}: {
  label: string;
  hint: string;
  selected: string[];
  soldOut: string[];
  summary: string;
  lang: Lang;
  onToggle: (size: string) => void;
}) {
  const known = new Set([...SIZE_LETTERS, ...SIZE_NUMBERS]);
  const extra = selected.filter((size) => !known.has(size));
  const sizes = [...SIZE_LETTERS, ...SIZE_NUMBERS, ...extra];

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex max-w-full flex-wrap gap-1.5">
        {sizes.map((size) => {
          const picked = selected.includes(size);
          const out = soldOut.includes(size);
          return (
            <button
              key={size}
              type="button"
              aria-pressed={picked}
              onClick={() => onToggle(size)}
              title={sizeLabel(size, lang)}
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
        {hint} {summary}
      </p>
    </div>
  );
}

/**
 * Image field: pick a file from the device (stored in Convex storage).
 * Keeps a read-only preview of the stored value for reference.
 */
function ImagePickerField({
  id,
  label,
  value,
  onPicked,
  multiple = false,
  onMultiplePicked,
}: {
  id: string;
  label: string;
  value: string;
  onPicked?: (url: string) => void;
  multiple?: boolean;
  onMultiplePicked?: (urls: string[]) => void;
}) {
  const { t } = useI18n();
  const uploadImage = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadImage(file));
      }
      if (multiple && onMultiplePicked) {
        onMultiplePicked(urls);
      } else if (urls[0] && onPicked) {
        onPicked(urls[0]);
      }
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
          type="button"
          variant="outline"
          className={cn(
            "h-11 min-w-0 flex-1",
            dragOver && "border-primary bg-primary/10 ring-primary/30 ring-2",
          )}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4 shrink-0" />
          <span className="truncate text-xs sm:text-sm">
            {busy ? t("admin.uploading") : t("admin.imageUpload")}
          </span>
        </Button>
        {value ? (
          <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
            <ProductImage src={value} alt="" sizes="44px" />
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
    </div>
  );}

/** In-app confirmation dialog — replaces the plain browser confirm(). */
function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onCancel())}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xs gap-0 rounded-none p-6 sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-base">{t("admin.confirmTitle")}</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 text-center text-xs leading-6">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10" onClick={onCancel}>
            {t("admin.cancel")}
          </Button>
          <Button
            variant="destructive"
            className="h-10"
            onClick={onConfirm}
          >
            {t("admin.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Horizontal scroller without a visible scrollbar: arrow buttons jump between
 * columns, and touch/drag with a finger (or mouse) pans the content.
 */
function SwipeTable({
  children,
  minWidth,
  label,
}: {
  children: React.ReactNode;
  minWidth: number;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The arrow buttons only make sense while the table really is wider than
  // its box — on a desktop, where everything fits, they used to float over
  // the table edges looking like a glitch.
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const content = contentRef.current;
    if (!track || !content) return;
    const check = () =>
      setOverflowing(content.scrollWidth - track.clientWidth > 4);
    check();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }
    const observer = new ResizeObserver(check);
    observer.observe(track);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const isAr = document.documentElement.dir === "rtl";
    const step = direction * (track.clientWidth * 0.7) * (isAr ? -1 : 1);
    track.scrollBy({ left: step, behavior: "smooth" });
  }

  // Drag with mouse / touch to pan.
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return; // native touch scroll handles it
    const track = trackRef.current;
    if (!track) return;
    const startX = event.clientX;
    const startLeft = track.scrollLeft;
    track.setPointerCapture(event.pointerId);
    track.style.cursor = "grabbing";
    function move(moveEvent: PointerEvent) {
      if (!track) return;
      track.scrollLeft = startLeft - (moveEvent.clientX - startX);
    }
    function up() {
      if (!track) return;
      track.style.cursor = "grab";
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
    }
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
  }

  return (
    <div className="relative min-w-0">
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        onPointerDown={onPointerDown}
        className={cn(
          "scrollbar-none min-w-0 overflow-x-auto",
          overflowing && "cursor-grab select-none",
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div ref={contentRef} style={{ minWidth }}>
          {children}
        </div>
      </div>
      {overflowing ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 start-0 hidden items-center min-[640px]:flex">
            <button
              type="button"
              aria-label="scroll back"
              onClick={() => scrollBy(-1)}
              className="bg-background/90 text-foreground pointer-events-auto grid size-8 place-items-center rounded-full border border-border/70 shadow-sm transition-colors hover:bg-muted"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 end-0 hidden items-center min-[640px]:flex">
            <button
              type="button"
              aria-label="scroll forward"
              onClick={() => scrollBy(1)}
              className="bg-background/90 text-foreground pointer-events-auto grid size-8 place-items-center rounded-full border border-border/70 shadow-sm transition-colors hover:bg-muted"
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Splits comma / newline separated input into clean values. */
function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatDate(timestamp: number, lang: string): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : "en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

/**
 * Dark-theme field shell: leading icon + input + (for passwords) a show/hide
 * toggle. The placeholders stay deliberately vague — they never hint at the
 * real credentials.
 */
function AdminField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete = "off",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  const { t } = useI18n();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-white/70">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 start-3.5 -translate-y-1/2 text-white/30">
          {isPassword ? (
            <KeyRound className="size-4" />
          ) : (
            <UserRound className="size-4" />
          )}
        </span>
        <Input
          id={id}
          type={isPassword && !reveal ? "password" : "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="border-white/15 bg-white/5 px-10 text-white placeholder:text-white/30"
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={reveal ? t("admin.pwHide") : t("admin.pwShow")}
            onClick={() => setReveal((current) => !current)}
            className="absolute top-1/2 end-2.5 grid size-7 -translate-y-1/2 place-items-center rounded-full text-white/40 transition-colors hover:text-white"
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The dashboard gate. Credentials are verified against the database
 * (salted hash on the server — nothing is hardcoded in the bundle), and the
 * factory password must be replaced before the dashboard opens.
 */
export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const { t, isAr } = useI18n();
  const ensureAccount = useMutation(api.admin.ensureAdminAccount);
  const checkLogin = useMutation(api.admin.checkAdminLogin);
  const changePassword = useMutation(api.admin.changeAdminPassword);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** True when the owner opened the password form from the sign-in screen. */
  const [changeOpen, setChangeOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeBusy, setChangeBusy] = useState(false);

  // Seeds the operator account rows (hashed factory password) on first visit —
  // a no-op once they exist.
  useEffect(() => {
    void ensureAccount({});
  }, [ensureAccount]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await checkLogin({
        username: username.trim(),
        password,
      });
      if (!result.ok) {
        setError(t("admin.invalid"));
        return;
      }
      /* A plain sign-in: nobody is forced to change the password. The owner can
         open the password form from here (or from the dashboard) whenever he
         wants. */
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      onSuccess();
    } catch {
      setError(t("admin.tryAgain"));
    } finally {
      setBusy(false);
    }
  }

  async function submitChange(event: React.FormEvent) {
    event.preventDefault();
    setChangeError("");
    if (!username.trim()) {
      setChangeError(t("admin.pwNeedUsername"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError(t("admin.pwMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      setChangeError(t("admin.pwTooShort"));
      return;
    }
    setChangeBusy(true);
    try {
      const result = await changePassword({
        username: username.trim(),
        currentPassword,
        newPassword,
      });
      if (!result.ok) {
        const reasons: Record<string, string> = {
          WRONG_CREDENTIALS: t("admin.invalid"),
          TOO_SHORT: t("admin.pwTooShort"),
          SAME_PASSWORD: t("admin.pwSame"),
        };
        setChangeError(reasons[result.reason ?? ""] ?? t("admin.pwChangeFailed"));
        return;
      }
      toast.success(t("admin.pwChanged"));
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      onSuccess();
    } catch {
      setChangeError(t("admin.tryAgain"));
    } finally {
      setChangeBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-foreground px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101010] p-8 text-white shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <HaMonogram className="size-12 text-white" />
          <div>
            <h1 className="font-display text-lg tracking-[0.24em] uppercase">
              HA Drip Boys
            </h1>
            <p
              className={cn(
                "mt-2 text-[11px] text-white/40",
                isAr ? "tracking-[0.08em]" : "tracking-[0.2em] uppercase",
              )}
            >
              {t("admin.dashboard")}
            </p>
          </div>
        </div>

        {changeOpen ? (
          <form onSubmit={submitChange} className="mt-8 space-y-4">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-[11px] leading-5 text-amber-200">
              {t("admin.pwChangeTitle")}
            </div>
            <AdminField
              id="changeUsername"
              label={t("admin.username")}
              value={username}
              onChange={setUsername}
              placeholder={t("admin.usernamePlaceholder")}
            />
            <AdminField
              id="currentPassword"
              label={t("admin.currentPassword")}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder={t("admin.pwEnterCurrent")}
            />
            <AdminField
              id="newPassword"
              label={t("admin.newPassword")}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder={t("admin.pwEnterNew")}
            />
            <AdminField
              id="confirmPassword"
              label={t("admin.confirmPassword")}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder={t("admin.pwRepeatNew")}
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword ? (
              <p className="text-[11px] text-red-300">{t("admin.pwMismatch")}</p>
            ) : null}
            {changeError ? (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                {changeError}
              </p>
            ) : null}
            <Button type="submit" className="h-11 w-full" disabled={changeBusy}>
              {t("admin.pwChangeButton")}
            </Button>
            <button
              type="button"
              onClick={() => {
                setChangeOpen(false);
                setChangeError("");
              }}
              className="w-full text-center text-[11px] text-white/45 transition-colors hover:text-white"
            >
              {t("admin.backToLogin")}
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <AdminField
              id="username"
              label={t("admin.username")}
              value={username}
              onChange={setUsername}
              placeholder={t("admin.usernamePlaceholder")}
            />
            <AdminField
              id="password"
              label={t("admin.password")}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder={t("admin.passwordPlaceholder")}
            />
            {error ? (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {t("admin.signIn")}
            </Button>
            {/* The password can be changed at any time, not only on day one. */}
            <button
              type="button"
              onClick={() => {
                setChangeOpen(true);
                setError("");
              }}
              className="w-full text-center text-[11px] text-white/45 transition-colors hover:text-white"
            >
              {t("admin.changePassword")}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <LanguageToggle onDark />
          <Link
            to="/"
            className="text-center text-[11px] text-white/40 hover:text-white"
          >
            {t("admin.backToStore")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Products manager                                                    */
/* ------------------------------------------------------------------ */

function ProductsManager({
  editId,
  deleteId,
  categories,
  onDone,
}: {
  /** Deep link from a product card's 3-dot menu (/admin?tab=products&edit=…). */
  editId?: string | null;
  /** Deep link from a product card's 3-dot menu (/admin?tab=products&delete=…). */
  deleteId?: string | null;
  /** Admin-managed categories from the database. */
  categories: Category[];
  /** Clears the deep-link params once handled so they never re-fire. */
  onDone?: () => void;
}) {
  const { t, lang } = useI18n();
  const products = useQuery(api.catalog.listProducts);
  const categoryRows = useQuery(api.catalog.listCategories);
  const orders = useQuery(api.orders.listOrders, { adminKey: ADMIN_API_KEY });
  /**
   * Sizes customers actually asked for, per product. The table shows these on
   * the first line of the sizes column, so the admin reads the size that was
   * chosen instead of having to guess among the product's whole range.
   * Cancelled orders never count.
   */
  const orderedSizes = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const order of orders ?? []) {
      if (order.status === "cancelled") continue;
      for (const item of order.items) {
        const sizes = map.get(item.productId) ?? [];
        if (!sizes.includes(item.size)) sizes.push(item.size);
        map.set(item.productId, sizes);
      }
    }
    return map;
  }, [orders]);
  const createProduct = useMutation(api.catalog.createProduct);
  const updateProduct = useMutation(api.catalog.updateProduct);
  const deleteProduct = useMutation(api.catalog.deleteProduct);

  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [editingId, setEditingId] = useState<Id<"products"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<Id<"products"> | null>(null);

  // No silent default any more: the admin is asked which category the new
  // product goes in, and the picker at the top of the form stays empty until
  // they answer (saving without a choice is blocked).

  // A card on the storefront asked to edit or delete a specific product.
  useEffect(() => {
    if (!products) return;
    if (editId) {
      const target = products.find((product) => product._id === editId);
      if (target) {
        startEdit(target);
        onDone?.();
      }
    } else if (deleteId) {
      const target = products.find((product) => product._id === deleteId);
      if (target) {
        setConfirmId(target._id);
        onDone?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, editId, deleteId]);

  function update<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_PRODUCT_FORM);
    setEditingId(null);
  }

  function startEdit(product: Product) {
    setEditingId(product._id);
    setForm({
      nameAr: product.nameAr,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      category: product.category,
      images: product.images.join("\n"),
      // Row 1 lists every size the piece comes in, row 2 marks the sold-out ones.
      availableSizes: product.sizes.map((size) => size.label).join(", "),
      soldOutSizes: product.sizes
        .filter((size) => !size.available)
        .map((size) => size.label)
        .join(", "),
      colors: product.colors.join(", "),
      colorStock: Object.fromEntries(
        (product.soldOutByColor ?? []).map((row) => [row.color, row.sizes]),
      ),
      descriptionAr: product.descriptionAr,
      featured: product.featured,
      soldOut: product.soldOut,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const available = splitList(form.availableSizes);
    const soldOut = splitList(form.soldOutSizes);
    if (!form.nameAr.trim()) {
      toast.error(t("admin.nameRequired"));
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error(t("admin.priceRequired"));
      return;
    }
    if (!form.category) {
      toast.error(t("admin.productCategoryRequired"));
      return;
    }

    setBusy(true);
    try {
      const payload = {
        adminKey: ADMIN_API_KEY,
        nameAr: form.nameAr.trim(),
        // Only the Arabic name is edited now — it is mirrored to the English
        // slot so English visitors read the same product name.
        nameEn: form.nameAr.trim(),
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        category: form.category,
        images: splitList(form.images),
        // One entry per picked size — a sold-out size stays a single row.
        sizes: available.map((label) => ({
          label,
          available: !soldOut.includes(label),
        })),
        colors: splitList(form.colors),
        // Per-colour stock: rows for the picked colours that have sold-out sizes.
        soldOutByColor: splitList(form.colors).map((color) => ({
          color,
          sizes: form.colorStock[color] ?? [],
        })),
        soldOut: form.soldOut,
        featured: form.featured,
        descriptionAr: form.descriptionAr.trim(),
        // Mirrored so the English view shows the same description.
        descriptionEn: form.descriptionAr.trim(),
      };

      if (editingId) {
        await updateProduct({ ...payload, id: editingId });
        toast.success(t("admin.productUpdated"));
      } else {
        await createProduct(payload);
        toast.success(t("admin.productAdded"));
      }
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t("admin.saveFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: Id<"products">) {
    try {
      await deleteProduct({ adminKey: ADMIN_API_KEY, id });
      if (editingId === id) resetForm();
      toast.success(t("admin.deleted"));
    } catch {
      toast.error(t("admin.deleteFailed"));
    } finally {
      setConfirmId(null);
    }
  }

  const headClass = "px-3 py-2.5 text-start text-[10px] tracking-[0.14em] uppercase sm:px-4 sm:py-3 sm:text-[11px]";
  const fieldClass = "grid gap-2"; /* probe */

  const pickedSizes = splitList(form.availableSizes);
  const soldOutList = splitList(form.soldOutSizes);

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:gap-8">
      <form onSubmit={submit} className="h-fit min-w-0 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {editingId ? t("admin.editProduct") : t("admin.newProduct")}
          </h2>
          {editingId ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              {t("admin.cancel")}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 space-y-4">
          {/* Asked first on purpose — the admin picks where this product goes. */}
          <div className={fieldClass}>
            <Label>{t("admin.category")}</Label>
            {categories.length === 0 ? (
              <p className="text-muted-foreground rounded-xl border border-dashed border-border px-3 py-4 text-[11px] leading-5">
                {t("admin.noCategoriesForProduct")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((category) => {
                  const selected = form.category === category.slug;
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update("category", category.slug)}
                      className={cn(
                        "overflow-hidden rounded-xl border text-start transition-colors",
                        selected
                          ? "border-foreground ring-foreground/30 ring-2"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      <span className="block h-16 w-full overflow-hidden bg-muted">
                        <ProductImage
                          src={category.image}
                          alt={categoryName(category, lang)}
                          sizes="120px"
                        />
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1.5 text-[11px]",
                          selected && "font-semibold",
                        )}
                      >
                        {selected ? (
                          <Check className="size-3.5 shrink-0" />
                        ) : null}
                        <span className="truncate">
                          {categoryName(category, lang)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className={fieldClass}>
            <Label htmlFor="nameAr">{t("admin.nameAr")}</Label>
            <Input
              id="nameAr"
              value={form.nameAr}
              onChange={(event) => update("nameAr", event.target.value)}
              placeholder={t("admin.nameArPlaceholder")}
            />
          </div>
          <div className={fieldClass}>
            <Label htmlFor="price">{t("admin.price")}</Label>
            <Input
              id="price"
              inputMode="numeric"
              dir="ltr"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
              placeholder="0"
            />
          </div>
          <div className={fieldClass}>
            <Label htmlFor="oldPrice">{t("admin.oldPrice")}</Label>
            <Input
              id="oldPrice"
              inputMode="numeric"
              dir="ltr"
              value={form.oldPrice}
              onChange={(event) => update("oldPrice", event.target.value)}
              placeholder="0"
            />
            <p className="text-muted-foreground text-[10px] leading-4">
              {form.oldPrice
                ? t("admin.discountOn", {
                    save: formatDA(
                      Math.max(0, Number(form.price || 0) - Number(form.oldPrice)),
                    ),
                  })
                : t("admin.discountOff")}
            </p>
          </div>
          {/* Photos come straight from the device — nothing to type. */}
          <div className={fieldClass}>
            <ImagePickerField
              id="images"
              label={t("admin.images")}
              value=""
              multiple
              onMultiplePicked={(urls) =>
                update("images", [...splitList(form.images), ...urls].join("\n"))
              }
            />
            <p className="text-muted-foreground text-[10px] leading-4">
              {t("admin.imagesHint")}
            </p>
            {splitList(form.images).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {splitList(form.images).map((url) => (
                  <div
                    key={url}
                    className="relative size-16 overflow-hidden rounded-lg border border-border/70 bg-muted"
                  >
                    <ProductImage src={url} alt="" sizes="64px" />
                    <button
                      type="button"
                      aria-label={t("admin.delete")}
                      onClick={() =>
                        update(
                          "images",
                          splitList(form.images)
                            .filter((item) => item !== url)
                            .join("\n"),
                        )
                      }
                      className="bg-foreground/85 text-background hover:bg-destructive absolute end-0 top-0 grid size-5 place-items-center rounded-full transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Sizes are picked like colours — never typed. */}
          <SizePicker
            label={t("admin.availableSizes")}
            hint={t("admin.availableSizesHint")}
            selected={pickedSizes}
            soldOut={soldOutList}
            onToggle={(size) => {
              const next = pickedSizes.includes(size)
                ? pickedSizes.filter((item) => item !== size)
                : [...pickedSizes, size];
              update("availableSizes", next.join(", "));
              // A size that is no longer offered cannot be sold out either.
              update(
                "soldOutSizes",
                soldOutList.filter((item) => next.includes(item)).join(", "),
              );
            }}
            summary={
              pickedSizes.length > 0
                ? t("admin.sizesPicked", { n: pickedSizes.length })
                : t("admin.sizesNone")
            }
            lang={lang}
          />

          {pickedSizes.length > 0 ? (
            <div className={fieldClass}>
              <Label>{t("admin.soldOutSizes")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {pickedSizes.map((size) => {
                  const out = soldOutList.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={out}
                      onClick={() =>
                        update(
                          "soldOutSizes",
                          out
                            ? soldOutList.filter((item) => item !== size).join(", ")
                            : [...soldOutList, size].join(", "),
                        )
                      }
                      className={cn(
                        "grid h-9 min-w-11 place-items-center rounded-lg border px-2 text-xs font-medium transition-colors",
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
          <div className={fieldClass}>
            <Label>{t("admin.colors")}</Label>
            <div className="flex max-w-full flex-wrap gap-1.5">
              {COLOR_KEYS.map((key) => {
                const selected = splitList(form.colors).includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      update(
                        "colors",
                        selected
                          ? splitList(form.colors).filter((item) => item !== key).join(", ")
                          : [...splitList(form.colors), key].join(", "),
                      )
                    }
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
              {splitList(form.colors).length === 0
                ? t("admin.noColorNote")
                : splitList(form.colors)
                    .map((key) => colorLabel(key, "ar"))
                    .join(" · ")}
            </p>
          </div>

          {/* Per-colour stock: sizes sold out for each picked colour. */}
          {pickedSizes.length > 0 && splitList(form.colors).length > 0 ? (
            <div className="grid gap-3">
              <Label>{t("admin.colorStock")}</Label>
              {splitList(form.colors).map((color) => {
                const outForColor = form.colorStock[color] ?? [];
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
                      {pickedSizes.map((size) => {
                        const out = outForColor.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            aria-pressed={out}
                            onClick={() =>
                              update("colorStock", {
                                ...form.colorStock,
                                [color]: out
                                  ? outForColor.filter((item) => item !== size)
                                  : [...outForColor, size],
                              })
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
                checked={form.featured}
                onChange={(event) => update("featured", event.target.checked)}
                className="size-4"
              />
              {t("admin.featured")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.soldOut}
                onChange={(event) => update("soldOut", event.target.checked)}
                className="size-4"
              />
              {t("admin.soldOutFlag")}
            </label>
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            <Plus className="size-4" />
            {editingId ? t("admin.saveChanges") : t("admin.addProduct")}
          </Button>
        </div>
      </form>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2 className="text-sm font-semibold">
            {t("admin.currentProducts", { n: products?.length ?? 0 })}
          </h2>
        </div>
        {/* Phones only: the 5-column table needs a wide box, so under 640px
            every product gets its own card with all of its details stacked
            and wrapping freely — nothing overlaps and nothing is cut off.
            From 640px up this block is hidden and the table is used as before. */}
        <div className="divide-y divide-border/70 sm:hidden">
          {(products ?? []).map((product) => (
            <article key={product._id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <ProductImage
                    src={product.images[0]}
                    alt={pickLang(product.nameAr, product.nameEn, lang)}
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6 font-medium break-words">
                    {pickLang(product.nameAr, product.nameEn, lang)}
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-5 break-words">
                    {liveCategoryLabel(categoryRows, product.category, lang)}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatDA(product.price)}
                    {product.oldPrice ? (
                      <span className="text-muted-foreground ms-2 text-[11px] font-normal line-through">
                        {formatDA(product.oldPrice)}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("admin.edit")}
                    onClick={() => startEdit(product)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("admin.delete")}
                    className="text-destructive"
                    onClick={() => setConfirmId(product._id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="text-[11px] leading-5">
                {(orderedSizes.get(product._id) ?? []).length > 0 ? (
                  /* A customer picked a size: show ONLY those sizes. */
                  <p className="font-semibold break-words text-emerald-700">
                    {t("admin.orderedSizes", {
                      sizes: (orderedSizes.get(product._id) ?? [])
                        .map((size) => sizeLabel(size, lang))
                        .join(" · "),
                    })}
                  </p>
                ) : (
                  /* Nothing ordered yet: show the sizes the product comes in. */
                  <p className="text-muted-foreground break-words">
                    {t("admin.productSizes", {
                      sizes:
                        product.sizes
                          .map((size) =>
                            size.available
                              ? sizeLabel(size.label, lang)
                              : `${sizeLabel(size.label, lang)} (✕)`,
                          )
                          .join(" · ") || "—",
                    })}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px]">
                {product.soldOut ? (
                  <span className="bg-foreground text-background w-fit rounded-full px-2 py-1">
                    {t("product.soldOut")}
                  </span>
                ) : (
                  <span className="w-fit rounded-full border border-border px-2 py-1">
                    {t("admin.available")}
                  </span>
                )}
                {product.featured ? (
                  <span className="text-brand w-fit">★ {t("admin.featured")}</span>
                ) : null}
              </div>
            </article>
          ))}
          {products && products.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-xs">
              {t("admin.noProducts")}
            </p>
          ) : null}
        </div>

        {/* Tablet & desktop: unchanged scrolling table. */}
        <div className="hidden sm:block">
        <SwipeTable minWidth={760} label={t("admin.currentProducts", { n: products?.length ?? 0 })}>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className={headClass}>{t("admin.colProduct")}</th>
                <th className={headClass}>{t("admin.colPrice")}</th>
                <th className={headClass}>{t("admin.colSizes")}</th>
                <th className={headClass}>{t("admin.colStatus")}</th>
                <th className={cn(headClass, "text-end")}>{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((product) => (
                <tr key={product._id} className="border-t border-border/70">
                  <td className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <ProductImage
                          src={product.images[0]}
                          alt={pickLang(product.nameAr, product.nameEn, lang)}
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {pickLang(product.nameAr, product.nameEn, lang)}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          {liveCategoryLabel(categoryRows, product.category, lang)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 sm:px-4 sm:py-3">
                    {formatDA(product.price)}
                    {product.oldPrice ? (
                      <span className="text-muted-foreground block text-[11px] line-through">
                        {formatDA(product.oldPrice)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2.5 py-2.5 text-[11px] sm:px-4 sm:py-3">
                    {(orderedSizes.get(product._id) ?? []).length > 0 ? (
                      /* A customer picked a size: show ONLY those sizes. */
                      <p className="font-semibold text-emerald-700">
                        {t("admin.orderedSizes", {
                          sizes: (orderedSizes.get(product._id) ?? [])
                            .map((size) => sizeLabel(size, lang))
                            .join(" · "),
                        })}
                      </p>
                    ) : (
                      /* Nothing ordered yet: show the sizes the product comes in. */
                      <p className="text-muted-foreground">
                        {t("admin.productSizes", {
                          sizes:
                            product.sizes
                              .map((size) =>
                                size.available
                                  ? sizeLabel(size.label, lang)
                                  : `${sizeLabel(size.label, lang)} (✕)`,
                              )
                              .join(" · ") || "—",
                        })}
                      </p>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex flex-col gap-1 text-[10px]">
                      {product.soldOut ? (
                        <span className="bg-foreground text-background w-fit rounded-full px-2 py-1">
                          {t("product.soldOut")}
                        </span>
                      ) : (
                        <span className="w-fit rounded-full border border-border px-2 py-1">
                          {t("admin.available")}
                        </span>
                      )}
                      {product.featured ? (
                        <span className="text-brand w-fit">★ {t("admin.featured")}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("admin.edit")}
                        onClick={() => startEdit(product)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("admin.delete")}
                        className="text-destructive"
                        onClick={() => setConfirmId(product._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products && products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted-foreground px-4 py-10 text-center text-xs"
                  >
                    {t("admin.noProducts")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </SwipeTable>
        </div>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        message={t("admin.deleteProductConfirm")}
        onConfirm={() => confirmId && void remove(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slider manager                                                      */
/* ------------------------------------------------------------------ */

type SliderFormState = {
  image: string;
  /** The only title field left — mirrored to the English slot on save. */
  titleAr: string;
  titleEn: string;
};

const EMPTY_SLIDER_FORM: SliderFormState = {
  image: "",
  titleAr: "",
  titleEn: "",
};

function SliderManager({
  editId,
  deleteId,
  replaceId,
  onDone,
}: {
  /** Deep link from a slide's 3-dot menu (/admin?tab=slider&edit=…). */
  editId?: string | null;
  /** Deep link from a slide's 3-dot menu (/admin?tab=slider&delete=…). */
  deleteId?: string | null;
  /** Deep link from a slide's 3-dot menu — jumps to the form in image mode. */
  replaceId?: string | null;
  /** Clears the deep-link params once handled so they never re-fire. */
  onDone?: () => void;
}) {
  const { t, lang } = useI18n();
  const sliders = useQuery(api.catalog.listSliders);
  const addSlider = useMutation(api.catalog.addSlider);
  const updateSlider = useMutation(api.catalog.updateSlider);
  const deleteSlider = useMutation(api.catalog.deleteSlider);

  const [form, setForm] = useState<SliderFormState>(EMPTY_SLIDER_FORM);
  const [editingId, setEditingId] = useState<Id<"sliders"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<Id<"sliders"> | null>(null);

  function update<K extends keyof SliderFormState>(key: K, value: SliderFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_SLIDER_FORM);
    setEditingId(null);
  }

  function startEdit(slide: { _id: Id<"sliders">; image: string; titleAr: string; titleEn: string }) {
    setEditingId(slide._id);
    setForm({
      image: slide.image,
      titleAr: slide.titleAr,
      titleEn: slide.titleEn,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // A slide on the storefront asked to edit, replace or delete itself.
  useEffect(() => {
    if (!sliders) return;
    const requested = editId ?? replaceId;
    if (requested) {
      const isDbSlide = !requested.startsWith("fallback-") && !requested.startsWith("hero-");
      const target = isDbSlide
        ? sliders.find((slide) => slide._id === requested)
        : sliders[Number(requested.split("-").pop()) % Math.max(sliders.length, 1)];
      if (target) {
        startEdit(target);
        onDone?.();
      }
    } else if (deleteId) {
      const target = sliders.find((slide) => slide._id === deleteId);
      if (target) {
        setConfirmId(target._id);
        onDone?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliders, editId, deleteId, replaceId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.image.trim()) {
      toast.error(t("admin.imageRequired"));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        adminKey: ADMIN_API_KEY,
        image: form.image.trim(),
        // Only the Arabic title is edited — mirrored to the English slot so the
        // English view reads the same text (same pattern as product names).
        titleAr: form.titleAr.trim(),
        titleEn: form.titleAr.trim(),
      };
      if (editingId) {
        await updateSlider({ ...payload, id: editingId });
        toast.success(t("admin.slideUpdated"));
      } else {
        await addSlider(payload);
        toast.success(t("admin.slideAdded"));
      }
      resetForm();
    } catch {
      toast.error(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: Id<"sliders">) {
    try {
      await deleteSlider({ adminKey: ADMIN_API_KEY, id });
      if (editingId === id) resetForm();
      toast.success(t("admin.slideDeleted"));
    } catch {
      toast.error(t("admin.deleteFailed"));
    } finally {
      setConfirmId(null);
    }
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-8">
      <form onSubmit={submit} className="h-fit min-w-0 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {editingId ? t("admin.editSlide") : t("admin.newSlide")}
          </h2>
          {editingId ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              {t("admin.cancel")}
            </Button>
          ) : null}
        </div>
        <div className="mt-5 space-y-4">
          <ImagePickerField
            id="sliderImage"
            label={t("admin.imageUrl")}
            value={form.image}
            onPicked={(url) => update("image", url)}
          />
          <div className="grid gap-2">
            <Label htmlFor="sliderTitleAr">{t("admin.titleAr")}</Label>
            <Input
              id="sliderTitleAr"
              value={form.titleAr}
              onChange={(event) => update("titleAr", event.target.value)}
              placeholder={t("admin.slideTitlePlaceholder")}
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            <ImageIcon className="size-4" />
            {editingId ? t("admin.saveChanges") : t("admin.addSlide")}
          </Button>
          <p className="text-muted-foreground text-[11px] leading-6">
            {t("admin.sliderHint")}
          </p>
        </div>
      </form>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4">
        {(sliders ?? []).map((slide) => (
          <div
            key={slide._id}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card"
          >
            <img
              src={slide.image}
              alt={pickLang(slide.titleAr, slide.titleEn, lang)}
              className="h-36 w-full object-cover"
            />
            <div className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm font-medium">
                {pickLang(slide.titleAr, slide.titleEn, lang)}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("admin.edit")}
                  onClick={() => startEdit(slide)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("admin.delete")}
                  className="text-destructive"
                  onClick={() => setConfirmId(slide._id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {sliders && sliders.length === 0 ? (
          <p className="text-muted-foreground col-span-full rounded-2xl border border-dashed border-border px-5 py-16 text-center text-xs">
            {t("admin.noSlides")}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        message={t("admin.slideDeleteConfirm")}
        onConfirm={() => confirmId && void remove(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Categories manager                                                  */
/* ------------------------------------------------------------------ */

/**
 * A category only needs two things: an English slug (which doubles as the
 * name shown on the site) and a photo. The Arabic/English name fields and
 * the size list were removed at the owner's request.
 */
const EMPTY_CATEGORY_FORM = {
  slug: "",
  image: "",
};

type CategoryFormState = typeof EMPTY_CATEGORY_FORM;

/** "sports-shoes" → "Sports Shoes" — the slug doubles as the display name. */
function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CategoriesManager({
  editId,
  deleteId,
  onDone,
}: {
  /** Deep link from a category card's 3-dot menu (/admin?tab=categories&edit=…). */
  editId?: string | null;
  /** Deep link from a category card's 3-dot menu (/admin?tab=categories&delete=…). */
  deleteId?: string | null;
  /** Clears the deep-link params once handled so they never re-fire. */
  onDone?: () => void;
}) {
  const { t, lang } = useI18n();
  const categories = useQuery(api.catalog.listCategories);
  const createCategory = useMutation(api.catalog.createCategory);
  const updateCategory = useMutation(api.catalog.updateCategory);
  const deleteCategory = useMutation(api.catalog.deleteCategory);

  const [form, setForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [editingId, setEditingId] = useState<Id<"categories"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<Id<"categories"> | null>(null);

  // A category card on the storefront asked to edit or delete this row.
  // Matched by database id — the card menu sends _id, not the slug.
  useEffect(() => {
    if (!categories) return;
    if (editId) {
      const target = categories.find((category) => category._id === editId);
      if (target) {
        startEdit(target);
        onDone?.();
      }
    } else if (deleteId) {
      const target = categories.find((category) => category._id === deleteId);
      if (target) {
        setConfirmId(target._id);
        onDone?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, editId, deleteId]);

  function update<K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_CATEGORY_FORM);
    setEditingId(null);
  }

  function startEdit(category: { _id: Id<"categories">; slug: string; image: string }) {
    setEditingId(category._id);
    setForm({ slug: category.slug, image: category.image });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.slug.trim() || !form.image.trim()) {
      toast.error(t("admin.categoryRequired"));
      return;
    }

    setBusy(true);
    try {
      const slug = form.slug.trim();
      const label = slugToLabel(slug);
      // The row being edited keeps its own size list / size-guide flag.
      const current = editingId
        ? categories?.find((category) => category._id === editingId)
        : undefined;
      const payload = {
        adminKey: ADMIN_API_KEY,
        slug,
        nameAr: label,
        nameEn: label,
        image: form.image.trim(),
        sizes: current?.sizes ?? [],
        hasSizeGuide: current?.hasSizeGuide ?? false,
      };

      if (editingId) {
        await updateCategory({ ...payload, id: editingId });
        toast.success(t("admin.categorySaved"));
      } else {
        await createCategory(payload);
        toast.success(t("admin.categorySaved"));
      }
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t("admin.saveFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: Id<"categories">) {
    try {
      await deleteCategory({ adminKey: ADMIN_API_KEY, id });
      if (editingId === id) resetForm();
      toast.success(t("admin.deleted"));
    } catch {
      toast.error(t("admin.deleteFailed"));
    } finally {
      setConfirmId(null);
    }
  }

  const headClass = "px-3 py-2.5 text-start text-[10px] tracking-[0.14em] uppercase sm:px-4 sm:py-3 sm:text-[11px]";
  const fieldClass = "grid gap-2";

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:gap-8">
      <form onSubmit={submit} className="h-fit min-w-0 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {editingId ? t("admin.editCategory") : t("admin.newCategory")}
          </h2>
          {editingId ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              {t("admin.cancel")}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 space-y-4">
          <div className={fieldClass}>
            <Label htmlFor="catSlug">{t("admin.slug")}</Label>
            <Input
              id="catSlug"
              dir="ltr"
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
              placeholder={t("admin.slugPlaceholder")}
            />
            <p className="text-muted-foreground text-[10px] leading-4">
              {t("admin.slugHint")}
            </p>
          </div>
          <ImagePickerField
            id="catImage"
            label={t("admin.categoryImage")}
            value={form.image}
            onPicked={(url) => update("image", url)}
          />
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            <Plus className="size-4" />
            {editingId ? t("admin.saveChanges") : t("admin.addCategory")}
          </Button>
        </div>
      </form>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2 className="text-sm font-semibold">
            {t("admin.currentCategories", { n: categories?.length ?? 0 })}
          </h2>
        </div>
        <SwipeTable minWidth={480} label={t("admin.currentCategories", { n: categories?.length ?? 0 })}>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className={headClass}>{t("admin.colCategory")}</th>
                <th className={headClass}>{t("admin.colImage")}</th>
                <th className={cn(headClass, "text-end")}>{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {(categories ?? []).map((category) => (
                <tr key={category._id} className="border-t border-border/70">
                  <td className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                    <p className="font-medium" dir="ltr">
                      {category.slug}
                    </p>
                    <p className="text-muted-foreground text-[10px]" dir="ltr">
                      /category/{category.slug}
                    </p>
                  </td>
                  <td className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <ProductImage src={category.image} alt={category.slug} sizes="48px" />
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("admin.edit")}
                        onClick={() => startEdit(category)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("admin.delete")}
                        className="text-destructive"
                        onClick={() => setConfirmId(category._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories && categories.length === 0 ? (
            <p className="text-muted-foreground border-t border-border/70 px-5 py-16 text-center text-xs">
              {t("admin.noCategories")}
            </p>
          ) : null}
        </SwipeTable>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        message={t("admin.deleteCategoryConfirm")}
        onConfirm={() => confirmId && void remove(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Orders manager                                                      */
/* ------------------------------------------------------------------ */

function OrdersManager() {
  const { t, lang } = useI18n();
  const orders = useQuery(api.orders.listOrders, { adminKey: ADMIN_API_KEY });
  const setStatus = useMutation(api.orders.setOrderStatus);
  const setNote = useMutation(api.orders.setOrderNote);
  const deleteOrder = useMutation(api.orders.deleteOrder);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<Id<"orders"> | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = orders ?? [];

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: list.length };
    for (const status of ORDER_STATUSES) {
      map[status.code] = list.filter((order) => order.status === status.code).length;
    }
    return map;
  }, [list]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!term) return true;
      return (
        order.customerName.toLowerCase().includes(term) ||
        order.phone.includes(term) ||
        order._id.toLowerCase().includes(term) ||
        String(order.total).includes(term)
      );
    });
  }, [list, statusFilter, search]);

  const revenue = list
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const deliveredRevenue = list
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + order.total, 0);
  const pendingCount = list.filter(
    (order) => order.status === "new" || order.status === "confirmed",
  ).length;
  const pieces = list.reduce(
    (sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0),
    0,
  );

  const statCard = "min-w-0 rounded-2xl border border-border/70 bg-card p-4 sm:p-5";
  const statLabel = "text-muted-foreground text-[10px]";

  async function updateStatus(id: Id<"orders">, status: string) {
    setBusyId(id);
    try {
      await setStatus({ adminKey: ADMIN_API_KEY, id, status });
    } finally {
      setBusyId(null);
    }
  }

  async function saveNote(id: Id<"orders">) {
    setBusyId(id);
    try {
      await setNote({ adminKey: ADMIN_API_KEY, id, adminNote: noteDraft });
      toast.success(t("admin.noteSaved"));
      setNoteDraft("");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: Id<"orders">) {
    setBusyId(id);
    try {
      await deleteOrder({ adminKey: ADMIN_API_KEY, id });
      toast.success(t("admin.deleted"));
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  function statusChip(code: string) {
    const styles: Record<string, string> = {
      new: "border-foreground bg-foreground text-background",
      confirmed: "border-blue-600/40 bg-blue-600/10 text-blue-700",
      shipped: "border-amber-600/40 bg-amber-600/10 text-amber-700",
      delivered: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700",
      cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
    };
    return cn(
      "w-fit rounded-full border px-2.5 py-1 text-[10px] font-medium whitespace-nowrap",
      styles[code] ?? "border-border",
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-4">
        <div className={statCard}>
          <p className={statLabel}>{t("admin.orders")}</p>
          <p className="mt-2 text-xl font-semibold sm:text-2xl">{list.length}</p>
        </div>
        <div className={statCard}>
          <p className={statLabel}>{t("admin.pendingCount")}</p>
          <p className="mt-2 text-xl font-semibold sm:text-2xl">{pendingCount}</p>
        </div>
        <div className={statCard}>
          <p className={statLabel}>{t("admin.revenue")}</p>
          <p className="mt-2 text-xl font-semibold sm:text-2xl">{formatDA(revenue)}</p>
        </div>
        <div className={statCard}>
          <p className={statLabel}>{t("admin.deliveredRevenue")}</p>
          <p className="mt-2 text-xl font-semibold sm:text-2xl">{formatDA(deliveredRevenue)}</p>
        </div>
      </div>

      {/* Filters: status chips + search */}
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] transition-colors",
              statusFilter === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/40",
            )}
          >
            {t("admin.filterAll")} ({counts.all})
          </button>
          {ORDER_STATUSES.map((status) => (
            <button
              key={status.code}
              type="button"
              onClick={() => setStatusFilter(status.code)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                statusFilter === status.code
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40",
              )}
            >
              {lang === "ar" ? status.ar : status.en} ({counts[status.code]})
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 start-3 size-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("admin.searchOrders")}
            className="h-9 ps-9 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed border-border px-5 py-16 text-center text-xs">
          {t("admin.noOrders")}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isOpen = expanded === order._id;
            return (
              <article
                key={order._id}
                className="min-w-0 rounded-2xl border border-border/70 bg-card"
              >
                {/* Compact row — always visible */}
                <div className="flex min-w-0 items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {order.customerName}
                      </p>
                      <span className={statusChip(order.status)}>
                        {orderStatusLabel(order.status, lang)}
                      </span>
                      {/* One-tap “handled & paid” — toggles the delivered state. */}
                      <button
                        type="button"
                        aria-pressed={order.status === "delivered"}
                        title={
                          order.status === "delivered"
                            ? t("admin.markPending")
                            : t("admin.markDelivered")
                        }
                        disabled={busyId === order._id}
                        onClick={() =>
                          void updateStatus(
                            order._id,
                            order.status === "delivered" ? "confirmed" : "delivered",
                          )
                        }
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                          order.status === "delivered"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-border text-transparent hover:border-emerald-600/60 hover:text-emerald-600/40",
                        )}
                      >
                        <Check className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      <a
                        href={`tel:${order.phone}`}
                        className="hover:text-foreground"
                        dir="ltr"
                      >
                        {order.phone}
                      </a>
                      <span>
                        {wilayaName(order.wilayaCode, lang, order.wilayaAr, order.wilayaFr)}
                      </span>
                      <span>{formatDate(order.createdAt, lang)}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-base font-semibold sm:text-lg">
                      {formatDA(order.total)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      {t("admin.orderItems", {
                        n: order.items.reduce((count, item) => count + item.quantity, 0),
                      })}
                    </p>
                  </div>
                </div>

                {/* Expand toggle + quick actions */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-[11px]"
                    onClick={() => {
                      setNoteDraft(order.adminNote ?? "");
                      setExpanded(isOpen ? null : order._id);
                    }}
                  >
                    <ChevronDown
                      className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
                    />
                    {isOpen ? t("admin.collapse") : t("admin.expand")}
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-[11px]">
                    <a href={`tel:${order.phone}`}>
                      <Phone className="size-3.5" />
                      {t("admin.callCustomer")}
                    </a>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-[11px]">
                    <a
                      href={`https://wa.me/213${order.phone.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-3.5" />
                      {t("admin.whatsappCustomer")}
                    </a>
                  </Button>
                  <span className="ms-auto" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("admin.delete")}
                    className="text-destructive"
                    disabled={busyId === order._id}
                    onClick={() => setConfirmId(order._id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* Expanded details */}
                {isOpen ? (
                  <div className="border-t border-border/60 p-4">
                    <p className="text-muted-foreground text-xs leading-6">
                      {order.address}
                      {order.note ? ` — ${order.note}` : ""}
                    </p>

                    {/* Status workflow */}
                    <div className="mt-4">
                      <p className="text-muted-foreground text-[10px] tracking-[0.14em] uppercase">
                        {t("admin.changeStatus")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ORDER_STATUSES.map((status) => (
                          <button
                            key={status.code}
                            type="button"
                            disabled={busyId === order._id || order.status === status.code}
                            onClick={() => void updateStatus(order._id, status.code)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[11px] transition-colors disabled:opacity-45",
                              order.status === status.code
                                ? "border-foreground bg-foreground text-background"
                                : "border-border hover:border-foreground/40",
                            )}
                          >
                            {lang === "ar" ? status.ar : status.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Items */}
                    <ul className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-2">
                      {order.items.map((item, index) => (
                        <li
                          key={`${order._id}-${index}`}
                          className="flex items-center gap-2.5 rounded-xl border border-border/60 p-2.5"
                        >
                          <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <ProductImage
                              src={item.image}
                              alt={pickLang(item.nameAr, item.nameEn, lang)}
                              sizes="44px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                              {pickLang(item.nameAr, item.nameEn, lang)}
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                              {t("admin.sizeShort", { size: sizeLabel(item.size, lang) })}
                              {item.color !== "—" ? ` · ${colorLabel(item.color, lang)}` : ""}
                              {` · ×${item.quantity}`}
                              {item.deliveryFee
                                ? ` · ${t("admin.deliveryShort", { fee: formatDA(item.deliveryFee) })}`
                                : ""}
                            </p>
                          </div>
                          <span className="shrink-0 whitespace-nowrap text-xs">
                            {formatDA(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Internal note */}
                    <div className="mt-4 grid gap-2">
                      <Label htmlFor={`note-${order._id}`}>{t("admin.adminNote")}</Label>
                      <Textarea
                        id={`note-${order._id}`}
                        rows={2}
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder={t("admin.adminNotePlaceholder")}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 w-fit"
                        disabled={busyId === order._id}
                        onClick={() => void saveNote(order._id)}
                      >
                        {t("admin.saveNote")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        message={t("admin.deleteOrderConfirm")}
        onConfirm={() => confirmId && void remove(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard shell                                                     */
/* ------------------------------------------------------------------ */

export default function Admin() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");

  /** Removes the one-shot edit/delete/replace params after they are handled. */
  function clearDeepLink() {
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    next.delete("delete");
    next.delete("replace");
    setSearchParams(next, { replace: true });
  }
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const categoryRows = useQuery(api.catalog.listCategories);
  const categories = liveCategories(categoryRows);

  useEffect(() => {
    setAuthenticated(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1");
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-foreground" />;
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/30">
      <header className="bg-foreground text-background">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Brand onDark />
            <span className="hidden text-[10px] tracking-[0.24em] text-white/40 uppercase sm:block">
              {t("admin.dashboard")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <LanguageToggle onDark />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/">
                <ExternalLink className="size-4" />
                <span className="hidden min-[420px]:inline">{t("admin.viewStore")}</span>
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
                setAuthenticated(false);
              }}
            >
              <LogOut className="size-4" />
              <span className="hidden min-[420px]:inline">{t("admin.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <Tabs
          value={
            requestedTab === "slider" ||
            requestedTab === "orders" ||
            requestedTab === "categories"
              ? requestedTab
              : "products"
          }
          onValueChange={(value) => {
            const next = new URLSearchParams(searchParams);
            if (value === "products") {
              next.delete("tab");
            } else {
              next.set("tab", value);
            }
            setSearchParams(next, { replace: true });
          }}
          className="gap-6"
        >
          <TabsList className={cn("h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-background p-1.5 sm:w-fit")}>
            <TabsTrigger value="products" className="gap-1.5 px-2.5 py-2.5 text-xs sm:gap-2 sm:px-4 sm:text-sm">
              <Package className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{t("admin.tabProducts")}</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5 px-2.5 py-2.5 text-xs sm:gap-2 sm:px-4 sm:text-sm">
              <Shapes className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{t("admin.tabCategories")}</span>
            </TabsTrigger>
            <TabsTrigger value="slider" className="gap-1.5 px-2.5 py-2.5 text-xs sm:gap-2 sm:px-4 sm:text-sm">
              <ImageIcon className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{t("admin.tabSlider")}</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5 px-2.5 py-2.5 text-xs sm:gap-2 sm:px-4 sm:text-sm">
              <Receipt className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{t("admin.tabOrders")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="mb-6 flex items-start gap-2.5 sm:gap-3">
              <Boxes className="size-5 shrink-0" />
              <p className="min-w-0 flex-1 text-xs font-semibold leading-5 sm:text-sm">{t("admin.productsLead")}</p>
            </div>
            <ProductsManager editId={searchParams.get("edit")} deleteId={searchParams.get("delete")} categories={categories} onDone={clearDeepLink} />
          </TabsContent>

          <TabsContent value="categories">
            <div className="mb-6 flex items-start gap-2.5 sm:gap-3">
              <Shapes className="size-5 shrink-0" />
              <p className="min-w-0 flex-1 text-xs font-semibold leading-5 sm:text-sm">{t("admin.categoriesLead")}</p>
            </div>
            <CategoriesManager editId={searchParams.get("edit")} deleteId={searchParams.get("delete")} onDone={clearDeepLink} />
          </TabsContent>

          <TabsContent value="slider">
            <div className="mb-6 flex items-start gap-2.5 sm:gap-3">
              <LayoutDashboard className="size-5 shrink-0" />
              <p className="min-w-0 flex-1 text-xs font-semibold leading-5 sm:text-sm">{t("admin.sliderLead")}</p>
            </div>
            <SliderManager
              editId={searchParams.get("edit")}
              deleteId={searchParams.get("delete")}
              replaceId={searchParams.get("replace")}
              onDone={clearDeepLink}
            />
          </TabsContent>

          <TabsContent value="orders">
            <div className="mb-6 flex items-start gap-2.5 sm:gap-3">
              <Receipt className="size-5 shrink-0" />
              <p className="min-w-0 flex-1 text-xs font-semibold leading-5 sm:text-sm">{t("admin.ordersLead")}</p>
            </div>
            <OrdersManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
