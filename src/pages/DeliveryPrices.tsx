import { useMutation, useQuery } from "convex/react";
import { MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { AdminPencil } from "@/components/store/AdminEdit";
import { Badge, SectionHeading } from "@/components/store/bits";
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
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { useI18n } from "@/lib/i18n";
import { STORE, WILAYAS, formatDA, matchesSearch } from "@/lib/store-data";
import { cn } from "@/lib/utils";

/**
 * Delivery prices, wilaya by wilaya.
 *
 * Shoppers look up their own wilaya before ordering; the admin (signed in on
 * this device) taps the pencil next to any wilaya to set or clear its price.
 * A wilaya without a price of its own is charged the shop-wide default.
 */
export default function DeliveryPrices() {
  const { t, lang, isAr } = useI18n();
  const prices = useQuery(api.delivery.listDeliveryPrices);
  const setDeliveryPrice = useMutation(api.delivery.setDeliveryPrice);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{
    code: number;
    label: string;
    price: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const defaultPrice = prices?.defaultPrice ?? STORE.deliveryFee;
  const rows = prices?.prices;
  const results = useMemo(
    () =>
      WILAYAS.filter((wilaya) =>
        matchesSearch(`${wilaya.code} ${wilaya.ar} ${wilaya.fr}`, query),
      ),
    [query],
  );

  /** The wilaya's own price, or null when it rides the default. */
  function priceFor(code: number): number | null {
    const row = rows?.find((entry) => entry.code === code);
    return row && row.price > 0 ? row.price : null;
  }

  async function savePrice(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const price = Math.max(
      0,
      Math.round(Number(editing.price.replace(/[^\d]/g, "")) || 0),
    );
    setBusy(true);
    try {
      await setDeliveryPrice({
        adminKey: ADMIN_API_KEY,
        wilayaCode: editing.code,
        price,
      });
      toast.success(t("delivery.saved"));
      setEditing(null);
    } catch {
      toast.error(t("delivery.error"));
    } finally {
      setBusy(false);
    }
  }

  const eyebrowClass = cn(
    "text-muted-foreground text-[10px]",
    isAr ? "tracking-[0.2em]" : "tracking-[0.34em] uppercase",
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeading eyebrow={t("delivery.eyebrow")} title={t("delivery.title")} />
      <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-7">
        {t("delivery.lead")}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="text-muted-foreground pointer-events-none absolute inset-y-0 start-3 my-auto size-4" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("delivery.search")}
            aria-label={t("delivery.search")}
            className="h-12 ps-9"
          />
        </div>
        <Badge variant="muted" className="h-8">
          {t("delivery.results", { n: results.length })}
        </Badge>
      </div>

      {results.length === 0 ? (
        <p className="text-muted-foreground mt-10 text-sm">{t("delivery.empty")}</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((wilaya) => {
            const own = priceFor(wilaya.code);
            const label = lang === "ar" ? wilaya.ar : wilaya.fr;
            return (
              <li
                key={wilaya.code}
                className="hover:border-foreground/30 flex items-center gap-3.5 rounded-2xl border border-border/70 p-4 transition-colors"
              >
                <span className="bg-muted text-foreground grid size-10 shrink-0 place-items-center rounded-xl text-xs font-semibold tabular-nums">
                  {String(wilaya.code).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-[10px] leading-4">
                    {own === null
                      ? isAr
                        ? "سعر التوصيل"
                        : "Delivery price"
                      : wilaya.fr}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {formatDA(own ?? defaultPrice)}
                </span>
                {/* Admin only — shoppers never render this pencil. */}
                <AdminPencil
                  label={t("delivery.editWilaya", { wilaya: label })}
                  onClick={() =>
                    setEditing({
                      code: wilaya.code,
                      label,
                      price: String(own ?? defaultPrice),
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-muted-foreground mt-10 flex items-start gap-2 text-[11px] leading-5">
        <MapPin className="mt-0.5 size-3.5 shrink-0" />
        {t("delivery.orderHint")}
      </p>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm gap-0 rounded-none p-6 sm:rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{t("delivery.editTitle")}</DialogTitle>
            <DialogDescription className="text-xs">
              {editing?.label}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={savePrice} className="mt-5 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="delivery-price">{t("cart.delivery")}</Label>
              <Input
                id="delivery-price"
                required
                inputMode="numeric"
                dir="ltr"
                value={editing?.price ?? ""}
                onChange={(event) =>
                  setEditing((current) =>
                    current && { ...current, price: event.target.value },
                  )
                }
                placeholder={t("delivery.pricePlaceholder")}
                className="h-12 text-base"
              />
              <p className={eyebrowClass}>{t("delivery.editHint")}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setEditing(null)}
              >
                {t("common.close")}
              </Button>
              <Button type="submit" className="h-11 flex-1" disabled={busy}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
