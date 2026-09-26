import { readFileSync, writeFileSync } from "node:fs";

function patch(file, pairs) {
  let text = readFileSync(file, "utf8");
  for (const [oldString, newString] of pairs) {
    if (!text.includes(oldString)) {
      console.error(`MISS in ${file}: ${oldString.slice(0, 70)}`);
      process.exit(1);
    }
    text = text.replaceAll(oldString, newString);
  }
  writeFileSync(file, text);
  console.log("OK:", file);
}

/* ------------------------------------------------------------------ */
/* 1. The brand name can never turn black on a black band              */
/* ------------------------------------------------------------------ */
patch("src/components/store/bits.tsx", [
  [
    `            responsive && "hidden sm:block",
            onBlack
              ? "text-white"
              : onDark
                ? "text-background"
                : "text-foreground",`,
    `            responsive && "hidden sm:block",
            /*
             * The name always takes the writing colour of the band it sits
             * on: the navbar sets its own, a black band sets the light one.
             * Guessing a token instead used to make it vanish on black.
             */
            onBlack ? "text-white" : "text-inherit",`,
  ],
  [
    `              responsive ? "hidden lg:block" : "hidden sm:block",
              onBlack
                ? "text-white/55"
                : onDark
                  ? "text-background/55"
                  : "text-muted-foreground",`,
    `              responsive ? "hidden lg:block" : "hidden sm:block",
              // The name's own colour, just quieter.
              onBlack ? "opacity-55" : "opacity-60",`,
  ],
  [
    `/* ------------------------------------------------------------------ */
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
}`,
    `/* ------------------------------------------------------------------ */
/* Brand mark — the square logo tile, live from the store settings     */
/* ------------------------------------------------------------------ */

export function StoreMark({ className }: { className?: string }) {
  /* The admin can swap the logo — every place it appears follows along. */
  const { logo, name } = useStoreBrand();
  return (
    <img src={logo} alt={name} className={cn("size-9 object-contain", className)} />
  );
}`,
  ],
  [`        <HaMonogram className="size-10 opacity-40" />`, `        <StoreMark className="size-10 opacity-40" />`],
]);

/* ------------------------------------------------------------------ */
/* 2. The two remaining call sites of the monogram                      */
/* ------------------------------------------------------------------ */
patch("src/pages/NotFound.tsx", [
  [`import { HaMonogram } from "@/components/store/bits";`, `import { StoreMark } from "@/components/store/bits";`],
  [`      <HaMonogram className="size-12 text-foreground" />`, `      <StoreMark className="size-12" />`],
]);

patch("src/pages/Admin.tsx", [
  [
    `import {
  Brand,
  HaMonogram,
  LanguageToggle,
  ProductImage,
} from "@/components/store/bits";`,
    `import {
  Brand,
  LanguageToggle,
  ProductImage,
  StoreMark,
} from "@/components/store/bits";`,
  ],
  [
    `import { Input } from "@/components/ui/input";`,
    `import { useStoreBrand } from "@/hooks/use-store-brand";\nimport { Input } from "@/components/ui/input";`,
  ],
  [
    `export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const { t, isAr } = useI18n();`,
    `export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const { t, isAr } = useI18n();
  /* The sign-in card wears the same live store name as the rest of the site. */
  const { name: brandName } = useStoreBrand();`,
  ],
  [
    `          <HaMonogram className="size-12 text-white" />
          <div>
            <h1 className="font-display text-lg tracking-[0.24em] uppercase">
              HA Drip Boys
            </h1>`,
    `          <StoreMark className="size-12" />
          <div>
            <h1 className="font-display text-lg tracking-[0.24em] uppercase">
              {brandName}
            </h1>`,
  ],
]);

/* ------------------------------------------------------------------ */
/* 3. The pencil leads with the name, then the tagline, then the image  */
/* ------------------------------------------------------------------ */
patch("src/components/store/AdminEdit.tsx", [
  [
    `        <ImageField
          id="logoImage"
          label={t("admin.logoImage")}
          value={value === "/brand.svg" ? "" : value}
          hint={t("admin.logoHint")}
          onChange={setValue}
        />
        <div className="grid gap-2">
          <Label htmlFor="logoBrandName">{t("admin.brandName")}</Label>`,
    `        <div className="grid gap-2">
          <Label htmlFor="logoBrandName">{t("admin.brandName")}</Label>`,
  ],
  [
    `          <p className="text-muted-foreground text-[10px] leading-4">
            {t("admin.taglineHint")}
          </p>
        </div>
        <div className="flex gap-2">`,
    `          <p className="text-muted-foreground text-[10px] leading-4">
            {t("admin.taglineHint")}
          </p>
        </div>
        <ImageField
          id="logoImage"
          label={t("admin.logoImage")}
          value={value === "/brand.svg" ? "" : value}
          hint={t("admin.logoHint")}
          onChange={setValue}
        />
        <div className="flex gap-2">`,
  ],
]);
