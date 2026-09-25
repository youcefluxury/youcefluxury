import { useMutation } from "convex/react";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { InstagramIcon, ProductImage } from "@/components/store/bits";
import { useStoreBrand } from "@/hooks/use-store-brand";
import { useStorePhone } from "@/hooks/use-store-phone";
import type { CartItem } from "@/lib/store-state";
import { pickLang, useI18n } from "@/lib/i18n";
import {
  STORE,
  WILAYAS,
  colorLabel,
  formatDA,
  instagramOrderLink,
  orderErrorMessage,
  sizeLabel,
  wilayaLabel,
} from "@/lib/store-data";
import { useCart } from "@/lib/store-state";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  customerName: "",
  phone: "",
  wilayaCode: "",
  address: "",
  note: "",
};

type OrderConfirmation = {
  /** Missing while the order is still being written into an Instagram chat. */
  reference?: string;
  items: CartItem[];
  itemsTotal: number;
  deliveryFee: number;
  total: number;
  customerName?: string;
  phone?: string;
  address?: string;
};

/** Full order text pre-filled in the Instagram / WhatsApp chat. */
function buildOrderMessage(confirmation: OrderConfirmation): string {
  const lines: string[] = [
    confirmation.reference
      ? `🛒 ${STORE.name} — ${confirmation.reference}`
      : `🛒 ${STORE.name}`,
    "",
  ];
  for (const item of confirmation.items) {
    const name = pickLang(item.nameAr, item.nameEn, "ar");
    lines.push(
      `• ${name} (${item.quantity}×) — ${item.size} / ${colorLabel(item.color, "ar")} — ${formatDA(item.price * item.quantity)}`,
    );
  }
  lines.push(
    "",
    `التوصيل: ${formatDA(confirmation.deliveryFee)}`,
    `المجموع: ${formatDA(confirmation.total)}`,
  );
  if (confirmation.customerName) {
    lines.push("", `الاسم: ${confirmation.customerName}`);
  }
  if (confirmation.phone) {
    lines.push(`الهاتف: ${confirmation.phone}`);
  }
  if (confirmation.address) {
    lines.push(`العنوان: ${confirmation.address}`);
  }
  return lines.join("\n");
}

export function CartDrawer() {
  const { t, lang, isAr } = useI18n();
  const { items, isOpen, closeCart, subtotal, count, setQuantity, removeItem, clearCart } =
    useCart();
  // Live shop phone — follows the number the admin saved from the storefront.
  const { display: storePhoneDisplay } = useStorePhone();
  // Live Instagram profile — orders land in the account the admin saved.
  const { instagram } = useStoreBrand();
  const createOrder = useMutation(api.orders.createOrder);

  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  useEffect(() => {
    if (!isOpen && !confirmation) {
      setStep("cart");
    }
  }, [isOpen, confirmation]);

  /**
   * Delivery is priced per product: every product carrying its own fee
   * contributes it once, whatever the quantity — and the same product in two
   * sizes/colours still counts once, exactly like the server recalculates it.
   * Products without a fee fall back to the shop default.
   */
  const deliveryFee = useMemo(() => {
    const seen = new Set<string>();
    let total = 0;
    for (const item of items) {
      if (seen.has(item.productId)) continue;
      seen.add(item.productId);
      total +=
        item.deliveryFee && item.deliveryFee > 0
          ? item.deliveryFee
          : STORE.deliveryFee;
    }
    return items.length > 0 ? total : 0;
  }, [items]);

  function update<K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    const wilaya = WILAYAS.find((item) => String(item.code) === form.wilayaCode);
    if (!wilaya) {
      toast.error(t("cart.chooseWilaya"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        customerName: form.customerName,
        phone: form.phone,
        wilayaCode: wilaya.code,
        wilayaAr: wilaya.ar,
        wilayaFr: wilaya.fr,
        address: form.address,
        note: form.note || undefined,
        paymentMethod: "cod",
        items: items.map((item) => ({
          productId: item.productId,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          price: item.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          image: item.image,
          deliveryFee: item.deliveryFee,
        })),
        deliveryFee,
        total: subtotal + deliveryFee,
      });
      const confirmed = {
        reference: result.reference,
        customerName: form.customerName.trim(),
        phone: form.phone,
        address: form.address.trim(),
        items,
        itemsTotal: result.itemsTotal,
        deliveryFee: result.deliveryFee,
        total: result.total,
      };
      clearCart();
      setForm(EMPTY_FORM);
      setChannelOpen(false);
      setConfirmation(confirmed);
      toast.success(t("cart.sent"));
    } catch (error) {
      const message =
        error instanceof Error ? orderErrorMessage(error.message, lang) : "";
      toast.error(message || t("cart.sendError"), {
        description: t("cart.sendErrorHint"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Instagram channel: jump straight into our chat with the whole order written.
   * Instagram refuses URL-prefilled DMs, so the text also lands on the clipboard
   * (copy started here, without awaiting, so the tab still opens unblocked).
   * Nothing is saved on the site, which is why no form comes first.
   */
  function orderViaInstagram() {
    const message = buildOrderMessage({
      items,
      itemsTotal: subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
    });
    window.open(instagramOrderLink(message, instagram), "_blank", "noreferrer");
    copyOrderText(message);
    setChannelOpen(false);
    toast.success(t("cart.openedInstagram"));
  }

  /** Instagram cannot pre-fill a DM, so the order text is copied for pasting. */
  function copyOrderText(message: string) {
    void navigator.clipboard?.writeText(message).catch(() => {});
  }

  /** “Order on the site” — the usual checkout form, unchanged. */
  function orderViaSite() {
    setChannelOpen(false);
    setStep("checkout");
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (open) return;
        closeCart();
        if (confirmation) setConfirmation(null);
      }}
    >
      <SheetContent
        side={isAr ? "left" : "right"}
        className="w-full gap-0 p-0 sm:max-w-md"
        aria-describedby={undefined}
      >
        <SheetHeader className="pe-14 border-b border-border/70">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="size-4" />
            {t("cart.title")}
          </SheetTitle>
          <SheetDescription>
            {confirmation
              ? t("cart.recorded")
              : count === 1
                ? t("cart.itemOne")
                : t("cart.items", { n: count })}
          </SheetDescription>
        </SheetHeader>

        {confirmation ? (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="bg-foreground text-background grid size-14 place-items-center rounded-full">
                <Check className="size-6" />
              </div>
              <h3 className="text-lg font-semibold">{t("cart.thanksTitle")}</h3>
              <p className="text-muted-foreground text-sm">{t("cart.thanksBody")}</p>
            </div>

            <div className="rounded-none border border-border/70 p-4">
              <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
                {t("cart.summary")}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {t("cart.orderNumber")} #{confirmation.reference}
              </p>

              <ul className="mt-3 space-y-2">
                {confirmation.items.map((item) => (
                  <li
                    key={item.key}
                    className="text-muted-foreground flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-foreground truncate font-medium">
                      {pickLang(item.nameAr, item.nameEn, lang)} ({item.quantity}×)
                    </span>
                    <span className="shrink-0">
                      {formatDA(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span>{formatDA(confirmation.itemsTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("cart.delivery")}</span>
                  <span>{formatDA(confirmation.deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>{t("cart.total")}</span>
                  <span>{formatDA(confirmation.total)}</span>
                </div>
              </div>

              {confirmation.address ? (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
                    {t("cart.deliveryAddress")}
                  </p>
                  <p className="mt-1 text-sm font-medium">{confirmation.customerName}</p>
                  <p dir="ltr" className="text-muted-foreground text-sm">
                    {confirmation.phone}
                  </p>
                  <p className="text-muted-foreground text-sm">{confirmation.address}</p>
                </div>
              ) : null}
            </div>

            <p className="text-muted-foreground flex items-center gap-2 text-[11px] leading-5">
              <Truck className="size-3.5 shrink-0" />
              {t("cart.callConfirm", { phone: storePhoneDisplay })}
            </p>

            <Button asChild className="w-full">
              <a
                href={instagramOrderLink(buildOrderMessage(confirmation), instagram)}
                target="_blank"
                rel="noreferrer"
                onClick={() => copyOrderText(buildOrderMessage(confirmation))}
              >
                {t("cart.confirmInstagram")}
              </a>
            </Button>
            <p className="text-muted-foreground -mt-3 text-center text-[10px] leading-4">
              {t("cart.instagramHint")}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setConfirmation(null);
                closeCart();
              }}
            >
              {t("cart.continue")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="bg-muted grid size-14 place-items-center rounded-full">
              <ShoppingBag className="text-muted-foreground size-6" />
            </div>
            <p className="text-sm font-medium">{t("cart.empty")}</p>
            <p className="text-muted-foreground text-xs leading-6">
              {t("cart.emptyBody")}
            </p>
            <Button asChild className="mt-2 w-full">
              <Link to="/shop" onClick={closeCart}>
                {t("cart.emptyCta")}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {step === "cart" ? (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="flex gap-3 rounded-2xl border border-border/70 p-3"
                    >
                      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <ProductImage
                          src={item.image}
                          alt={pickLang(item.nameAr, item.nameEn, lang)}
                          sizes="80px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm leading-5 font-semibold">
                            {pickLang(item.nameAr, item.nameEn, lang)}
                          </p>
                          <button
                            type="button"
                            aria-label={t("cart.remove")}
                            onClick={() => removeItem(item.key)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          {t("cart.sizeLabel", { size: sizeLabel(item.size, lang) })}
                          {item.color && item.color !== "—"
                            ? ` · ${colorLabel(item.color, lang)}`
                            : ` · ${colorLabel("", lang)}`}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-border px-1">
                            <button
                              type="button"
                              aria-label={t("product.quantityMinus")}
                              onClick={() => setQuantity(item.key, item.quantity - 1)}
                              className="grid size-7 place-items-center rounded-full hover:bg-muted"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={t("product.quantityPlus")}
                              onClick={() => setQuantity(item.key, item.quantity + 1)}
                              className="grid size-7 place-items-center rounded-full hover:bg-muted"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold">
                            {formatDA(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <form id="checkout-form" onSubmit={submitOrder} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerName">{t("form.fullName")}</Label>
                    <Input
                      id="customerName"
                      required
                      value={form.customerName}
                      onChange={(event) => update("customerName", event.target.value)}
                      placeholder={t("form.fullNamePlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t("form.phone")}</Label>
                    <Input
                      id="phone"
                      required
                      inputMode="tel"
                      dir="ltr"
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      placeholder={t("form.phonePlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("form.wilaya")}</Label>
                    <Select
                      value={form.wilayaCode}
                      onValueChange={(value) => update("wilayaCode", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("form.wilayaPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {WILAYAS.map((wilaya) => (
                          <SelectItem key={wilaya.code} value={String(wilaya.code)}>
                            {wilayaLabel(wilaya, lang)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">{t("form.address")}</Label>
                    <Textarea
                      id="address"
                      required
                      rows={2}
                      value={form.address}
                      onChange={(event) => update("address", event.target.value)}
                      placeholder={t("form.addressPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="note">{t("form.note")}</Label>
                    <Input
                      id="note"
                      value={form.note}
                      onChange={(event) => update("note", event.target.value)}
                      placeholder={t("form.notePlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("form.payment")}</Label>
                    <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm">
                      <span className="bg-foreground text-background grid size-5 place-items-center rounded-full">
                        <Check className="size-3" />
                      </span>
                      {t("checkout.cod")}
                    </div>
                  </div>

                </form>
              )}
            </div>

            <div className="border-t border-border/70 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span className="text-base font-semibold">{formatDA(subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.delivery")}</span>
                <span>{formatDA(deliveryFee)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 text-sm font-semibold">
                <span>{t("cart.total")}</span>
                <span className="text-base">{formatDA(subtotal + deliveryFee)}</span>
              </div>

              {step === "cart" ? (
                /* Checkout first asks how the order should reach us. */
                <Button className="mt-4 h-11 w-full" onClick={() => setChannelOpen(true)}>
                  {t("cart.checkout")}
                  <ArrowLeft className={cn("size-4", !isAr && "rotate-180")} />
                </Button>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => setStep("cart")}
                  >
                    {t("common.back")}
                  </Button>
                  <Button
                    type="button"
                    className="h-11 flex-1"
                    disabled={submitting}
                    onClick={(event) => void submitOrder(event)}
                  >
                    {t("cart.placeOrder")}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* “Checkout” → choose how the order reaches us: Instagram chat or the
            site's own form. */}
        <Dialog open={channelOpen} onOpenChange={setChannelOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-sm gap-0 rounded-none p-6 sm:rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-center text-base">
                {t("cart.channelTitle")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("cart.channelTitle")}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 grid gap-3">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-0.5 py-3"
                disabled={submitting}
                onClick={orderViaInstagram}
              >
                <span className="flex w-full items-center gap-2 text-sm">
                  <InstagramIcon className="size-4" />
                  {t("cart.channelInstagram")}
                </span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {t("cart.channelInstagramNote")}
                </span>
              </Button>
              <Button
                className="h-auto w-full flex-col items-start gap-0.5 py-3"
                disabled={submitting}
                onClick={orderViaSite}
              >
                <span className="flex w-full items-center gap-2 text-sm">
                  <ShoppingBag className="size-4" />
                  {t("cart.channelSite")}
                </span>
                <span className="text-[10px] font-normal opacity-70">
                  {t("cart.channelSiteNote")}
                </span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
