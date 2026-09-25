import { useMutation } from "convex/react";
import { Minus, MoreHorizontal, PhoneCall, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { ADMIN_API_KEY } from "@/lib/admin-key";
import { CartDrawer } from "@/components/store/CartDrawer";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { useIsAdminSession } from "@/components/store/bits";
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
import { useStorePhone } from "@/hooks/use-store-phone";
import { useI18n } from "@/lib/i18n";

/**
 * Floating call button, present on every storefront page. Shoppers can hide the
 * number with the small ✕ (leaving only the icon) and bring it back the same
 * way. Signed-in admins also get a 3-dot menu on it to change the phone number,
 * which then updates everywhere on the site.
 */
function PhoneButton() {
  const { t } = useI18n();
  /* `whatsapp` is the international form of the number, used here for dialing. */
  const { phone, display, whatsapp } = useStorePhone();
  const isAdmin = useIsAdminSession();
  const savePhone = useMutation(api.catalog.setPhone);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /* The ✕ toggles the number: hidden keeps only the call icon. */
  const [showNumber, setShowNumber] = useState(true);

  async function handleSave() {
    const digits = draft.replace(/\D+/g, "");
    if (digits.length < 9) {
      setError(t("phone.invalid"));
      return;
    }
    setBusy(true);
    try {
      await savePhone({ adminKey: ADMIN_API_KEY, phone: digits });
      toast.success(t("phone.saved"));
      setOpen(false);
    } catch {
      toast.error(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <div className="fixed bottom-5 end-5 z-30">
      {isAdmin ? (
        <button
          type="button"
          aria-label={t("phone.edit")}
          onClick={() => {
            setDraft(phone);
            setError("");
            setOpen(true);
          }}
          className="bg-background text-foreground absolute -top-2 -start-2 z-10 grid size-7 place-items-center rounded-full border border-border/70 shadow-sm transition-colors hover:bg-muted"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      ) : null}
        <div className="relative">
          {/* A plain phone number: tapping dials it — never WhatsApp. */}
          <a
            href={`tel:+${whatsapp}`}
            aria-label={t("common.phoneAria")}
            className={
              "group flex items-center gap-2 rounded-full bg-[#0a0a0a] py-3 text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5 " +
              (showNumber ? "ps-3 pe-4" : "px-3")
            }
          >
            <PhoneCall className="size-5 shrink-0" aria-hidden="true" />
            {showNumber ? (
              <span className="text-xs font-medium tracking-wide">
                {display}
              </span>
            ) : null}
          </a>
          {/* ✕ hides the number; once it is collapsed the mark turns into a −
              that brings it back. */}
          <button
            type="button"
            aria-label={t(showNumber ? "phone.hideNumber" : "phone.showNumber")}
            title={t(showNumber ? "phone.hideNumber" : "phone.showNumber")}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setShowNumber((visible) => !visible);
            }}
            className="bg-background text-foreground absolute -top-2 -end-2 z-10 grid size-7 place-items-center rounded-full border border-border/70 shadow-sm transition-colors hover:bg-muted"
          >
            {showNumber ? (
              <X className="size-3.5" />
            ) : (
              <Minus className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Admin-only: change the phone number, centred on phones. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm gap-0 rounded-none p-5 sm:rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{t("phone.edit")}</DialogTitle>
            <DialogDescription className="text-[11px] leading-5">
              {t("phone.hint")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-2">
            <Label htmlFor="store-phone">{t("phone.title")}</Label>
            <Input
              id="store-phone"
              dir="ltr"
              inputMode="tel"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError("");
              }}
              placeholder={t("phone.placeholder")}
            />
            {error ? (
              <p className="text-destructive text-[11px]">{error}</p>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              {t("admin.cancel")}
            </Button>
            <Button
              type="button"
              className="h-10"
              disabled={busy}
              onClick={() => void handleSave()}
            >
              {t("admin.saveChanges")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StoreLayout() {
  const ensureSeed = useMutation(api.catalog.ensureSeed);
  const purgeLegacyCategories = useMutation(api.catalog.purgeLegacyCategories);
  const location = useLocation();

  // Fills the shop with the demo catalogue on first run (no-op afterwards)
  // and once, at the owner's request, removes the original demo categories
  // so they can start with a fresh, empty set.
  useEffect(() => {
    ensureSeed({})
      .then(() => purgeLegacyCategories({}))
      .catch((error) => {
        console.warn("[HA Drip Boys] seed skipped:", error);
      });
  }, [ensureSeed, purgeLegacyCategories]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter />
      <CartDrawer />
      <PhoneButton />
    </div>
  );
}
