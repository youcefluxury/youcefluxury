import { Facebook, Phone, ShieldCheck, Truck } from "lucide-react";
import { useQuery } from "convex/react";
import { Link } from "react-router";

import { api } from "@/convex/_generated/api";
import { InstagramIcon, Brand, LanguageToggle } from "@/components/store/bits";
import {
  FacebookEditButton,
  InstagramEditButton,
} from "@/components/store/AdminEdit";
import { useStorePhone } from "@/hooks/use-store-phone";
import { useStoreBrand } from "@/hooks/use-store-brand";
import { useI18n } from "@/lib/i18n";
import { STORE, categoryName, whatsappLink } from "@/lib/store-data";
import { cn } from "@/lib/utils";

export function StoreFooter() {
  const { t, lang, isAr } = useI18n();
  // Live phone number — whatever the admin saved from the storefront.
  const { phone, display } = useStorePhone();
  // Live identity — social links, store name and description, editable by the
  // admin from the icons themselves or from the dashboard's design tab.
  const { instagram, facebook, name } = useStoreBrand();

  // Live category list — admin edits appear here immediately.
  const categoryRows = useQuery(api.catalog.listCategories);
  const categories = categoryRows ?? [];
  const heading = cn(
    "text-[10px] text-white/40",
    isAr ? "tracking-[0.2em]" : "tracking-[0.3em] uppercase",
  );

  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <Brand onDark />
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
              {t("footer.about")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="relative">
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("common.instagram")}
                  className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:bg-white/10"
                >
                  <InstagramIcon className="size-5" />
                </a>
                {/* Admin only: edit the Instagram link from here too. */}
                <InstagramEditButton className="absolute -top-1.5 -start-1.5" />
              </span>
              <span className="relative">
                <a
                  href={facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("common.facebook")}
                  className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:bg-white/10"
                >
                  <Facebook className="size-5 text-[#1877F2]" />
                </a>
                {/* Admin only: edit the Facebook link from here too. */}
                <FacebookEditButton className="absolute -top-1.5 -start-1.5" />
              </span>
              <a
                href={`tel:${phone}`}
                aria-label={t("common.phone")}
                className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:bg-white/10"
              >
                <Phone className="size-5" />
              </a>
              <LanguageToggle onDark className="ms-1" />
            </div>
          </div>            <div>
              <h3 className={heading}>{t("common.shop")}</h3>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <Link to="/shop" className="text-white/70 hover:text-white">
                    {t("common.allProducts")}
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category._id}>
                    <Link
                      to={`/category/${category.slug}`}
                      className="text-white/70 hover:text-white"
                    >
                      {categoryName(category, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          <div>
            <h3 className={heading}>{t("footer.service")}</h3>
            <ul className="mt-5 space-y-4 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 size-4 shrink-0" />
                {/* Opens the per-wilaya price list. */}
                <Link
                  to="/delivery"
                  title={t("footer.deliveryPrices")}
                  className="hover:text-white"
                >
                  {t("footer.delivery")}
                </Link>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                {t("footer.cod")}
              </li>
            </ul>
          </div>

          <div>
            <h3 className={heading}>{t("footer.contact")}</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li>
                <a href={`tel:${phone}`} className="hover:text-white">
                  {display}
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(undefined, phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  {t("common.whatsapp")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] tracking-wide text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t("footer.rights", {
              year: new Date().getFullYear(),
              store: name,
            })}
          </span>
          <Link to="/admin" className="hover:text-white/70">
            {t("footer.admin")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
