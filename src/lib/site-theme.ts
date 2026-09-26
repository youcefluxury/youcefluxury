/**
 * Site designs the admin picks from the dashboard (“Site design” tab).
 *
 * Every preset is a list of CSS custom properties written straight onto
 * `<html>`, so the whole storefront — header, footer, buttons, cards, corner
 * radius — restyles at once without touching any product or order. The chosen
 * design is saved in the database *and* mirrored into localStorage, so the
 * first paint after a reload already wears it.
 */

/** localStorage key shared with the instant-apply step in main.tsx. */
export const SITE_THEME_STORAGE_KEY = "hadrip.site-theme";

/** Every token a preset may set — cleared before the next one is applied. */
export const SITE_THEME_TOKEN_KEYS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--input",
  "--ring",
  "--ink",
  "--paper",
  "--brand",
  "--radius",
] as const;

export type SiteThemePreset = {
  id: string;
  nameAr: string;
  nameEn: string;
  blurbAr: string;
  blurbEn: string;
  /** Dark presets also switch the browser's `color-scheme`. */
  dark?: boolean;
  /** oklch values; an empty map means “keep the built-in black & white”. */
  tokens: Record<string, string>;
};

/**
 * A compact palette description expanded into the full token set. Building the
 * presets this way keeps every design complete: a colour can never land
 * half-themed, and the contrast pairs stay in step with each other.
 */
type Palette = {
  /** Page background. */
  bg: string;
  /** Cards and popovers — a touch lighter than the page. */
  surface: string;
  /** Headings and body copy. */
  fg: string;
  /** Secondary copy. */
  mutedFg: string;
  /** Main action colour. */
  primary: string;
  /** Writing on top of `primary`. */
  onPrimary: string;
  /** Quiet fill: muted rows, hover states. */
  fill: string;
  /** Hairlines. */
  border: string;
  /** Focus ring. */
  ring: string;
  /** Dark bands and badges. */
  ink: string;
  /** The store's refined accent. */
  brand: string;
  /** Card corner radius. */
  radius: string;
};

function makeTokens(p: Palette): Record<string, string> {
  return {
    "--background": p.bg,
    "--foreground": p.fg,
    "--card": p.surface,
    "--card-foreground": p.fg,
    "--popover": p.surface,
    "--popover-foreground": p.fg,
    "--primary": p.primary,
    "--primary-foreground": p.onPrimary,
    "--secondary": p.fill,
    "--secondary-foreground": p.fg,
    "--muted": p.fill,
    "--muted-foreground": p.mutedFg,
    "--accent": p.fill,
    "--accent-foreground": p.fg,
    "--border": p.border,
    "--input": p.border,
    "--ring": p.ring,
    "--ink": p.ink,
    "--paper": p.surface,
    "--brand": p.brand,
    "--radius": p.radius,
  };
}

/** The wider palette the store can wear, added after the original designs. */
const EXTRA_THEMES: SiteThemePreset[] = [
  {
    id: "honey",
    nameAr: "عسلي دافئ",
    nameEn: "Warm Honey",
    blurbAr: "عسلي ذهبي دافئ مع بنّي متباين وحواف مستديرة.",
    blurbEn: "Warm honey gold with a deep brown and softly rounded corners.",
    tokens: makeTokens({
      bg: "oklch(0.985 0.014 88)",
      surface: "oklch(1 0.008 88)",
      fg: "oklch(0.26 0.035 68)",
      mutedFg: "oklch(0.53 0.035 78)",
      primary: "oklch(0.44 0.11 66)",
      onPrimary: "oklch(0.99 0.012 90)",
      fill: "oklch(0.96 0.026 85)",
      border: "oklch(0.9 0.028 82)",
      ring: "oklch(0.62 0.1 72)",
      ink: "oklch(0.27 0.045 68)",
      brand: "oklch(0.74 0.14 78)",
      radius: "0.5rem",
    }),
  },
  {
    id: "forest",
    nameAr: "غابة هادئة",
    nameEn: "Calm Forest",
    blurbAr: "أخضر غابة عميق مع كريمي دافئ ولمسة ذهبية.",
    blurbEn: "Deep forest green on warm cream with a small golden touch.",
    tokens: makeTokens({
      bg: "oklch(0.985 0.009 152)",
      surface: "oklch(1 0.005 152)",
      fg: "oklch(0.24 0.035 155)",
      mutedFg: "oklch(0.52 0.03 152)",
      primary: "oklch(0.38 0.08 155)",
      onPrimary: "oklch(0.99 0.008 150)",
      fill: "oklch(0.96 0.02 150)",
      border: "oklch(0.9 0.024 150)",
      ring: "oklch(0.58 0.09 152)",
      ink: "oklch(0.26 0.05 155)",
      brand: "oklch(0.7 0.13 148)",
      radius: "0.625rem",
    }),
  },
  {
    id: "crimson",
    nameAr: "قرمزي",
    nameEn: "Crimson",
    blurbAr: "أحمر قرمزي واثق مع وردي داكن وحواف حادة.",
    blurbEn: "Confident crimson with a deep rose and sharp, crisp corners.",
    tokens: makeTokens({
      bg: "oklch(0.985 0.006 22)",
      surface: "oklch(1 0.004 22)",
      fg: "oklch(0.25 0.045 20)",
      mutedFg: "oklch(0.53 0.04 22)",
      primary: "oklch(0.42 0.16 25)",
      onPrimary: "oklch(0.99 0.01 25)",
      fill: "oklch(0.96 0.022 24)",
      border: "oklch(0.9 0.026 24)",
      ring: "oklch(0.58 0.15 25)",
      ink: "oklch(0.27 0.09 22)",
      brand: "oklch(0.68 0.16 28)",
      radius: "0.25rem",
    }),
  },
  {
    id: "azure",
    nameAr: "أزرق سماوي",
    nameEn: "Azure",
    blurbAr: "أزرق سماوي صافي مع لمسة فيروزية وحواف دائرية.",
    blurbEn: "Clean azure blue with a turquoise accent and round corners.",
    tokens: makeTokens({
      bg: "oklch(0.985 0.008 245)",
      surface: "oklch(1 0.004 245)",
      fg: "oklch(0.25 0.035 250)",
      mutedFg: "oklch(0.53 0.03 248)",
      primary: "oklch(0.42 0.11 250)",
      onPrimary: "oklch(0.99 0.008 245)",
      fill: "oklch(0.96 0.02 245)",
      border: "oklch(0.9 0.024 245)",
      ring: "oklch(0.6 0.1 250)",
      ink: "oklch(0.28 0.055 252)",
      brand: "oklch(0.7 0.12 215)",
      radius: "0.875rem",
    }),
  },
  {
    id: "lavender",
    nameAr: "لافندر",
    nameEn: "Lavender",
    blurbAr: "بنفسجي لافندر ناعم مع أبيض وردي وحواف مستديرة جداً.",
    blurbEn: "Soft lavender purple on a rosy white with very round corners.",
    tokens: makeTokens({
      bg: "oklch(0.985 0.01 300)",
      surface: "oklch(1 0.006 300)",
      fg: "oklch(0.28 0.04 300)",
      mutedFg: "oklch(0.55 0.035 300)",
      primary: "oklch(0.44 0.12 300)",
      onPrimary: "oklch(0.99 0.01 300)",
      fill: "oklch(0.965 0.022 300)",
      border: "oklch(0.9 0.026 300)",
      ring: "oklch(0.63 0.11 300)",
      ink: "oklch(0.3 0.055 300)",
      brand: "oklch(0.72 0.13 305)",
      radius: "1rem",
    }),
  },
  {
    id: "teal",
    nameAr: "أزرق مخضر",
    nameEn: "Teal",
    blurbAr: "أزرق مخضر بحري مع لمسة ذهبية وحواف متوازنة.",
    blurbEn: "Ocean teal with a golden accent and a balanced, easy shape.",
    tokens: makeTokens({
      bg: "oklch(0.985 0.008 200)",
      surface: "oklch(1 0.004 200)",
      fg: "oklch(0.25 0.03 205)",
      mutedFg: "oklch(0.53 0.028 202)",
      primary: "oklch(0.4 0.075 200)",
      onPrimary: "oklch(0.99 0.008 200)",
      fill: "oklch(0.96 0.018 200)",
      border: "oklch(0.9 0.022 200)",
      ring: "oklch(0.58 0.08 200)",
      ink: "oklch(0.27 0.045 205)",
      brand: "oklch(0.74 0.11 180)",
      radius: "0.75rem",
    }),
  },
  {
    id: "cocoa",
    nameAr: "كاكاو",
    nameEn: "Cocoa",
    blurbAr: "بني كاكاو غني مع كريمي دافئ ولمسة نحاسية.",
    blurbEn: "Rich cocoa brown on warm cream with a copper highlight.",
    tokens: makeTokens({
      bg: "oklch(0.975 0.012 62)",
      surface: "oklch(0.995 0.008 62)",
      fg: "oklch(0.27 0.04 55)",
      mutedFg: "oklch(0.53 0.035 60)",
      primary: "oklch(0.36 0.06 52)",
      onPrimary: "oklch(0.98 0.014 70)",
      fill: "oklch(0.95 0.022 62)",
      border: "oklch(0.89 0.026 60)",
      ring: "oklch(0.58 0.07 58)",
      ink: "oklch(0.28 0.05 52)",
      brand: "oklch(0.64 0.1 50)",
      radius: "0.625rem",
    }),
  },
  {
    id: "rose",
    nameAr: "وردي باهت",
    nameEn: "Dusty Rose",
    blurbAr: "وردي باهت راقٍ مع توت داكن وحواف ناعمة.",
    blurbEn: "Refined dusty rose with a deep berry tone and soft corners.",
    tokens: makeTokens({
      bg: "oklch(0.985 0.008 12)",
      surface: "oklch(1 0.005 12)",
      fg: "oklch(0.28 0.04 8)",
      mutedFg: "oklch(0.55 0.032 10)",
      primary: "oklch(0.44 0.11 8)",
      onPrimary: "oklch(0.99 0.01 12)",
      fill: "oklch(0.965 0.02 10)",
      border: "oklch(0.9 0.024 10)",
      ring: "oklch(0.62 0.1 8)",
      ink: "oklch(0.3 0.06 6)",
      brand: "oklch(0.68 0.14 12)",
      radius: "1.125rem",
    }),
  },
  {
    id: "noir",
    nameAr: "أسود فاخر",
    nameEn: "Luxe Noir",
    blurbAr: "أسود نقي فاخر للموقع كله مع لمسة ذهبية عميقة.",
    blurbEn: "Pure luxe black across the whole store with a deep gold accent.",
    dark: true,
    tokens: makeTokens({
      bg: "oklch(0.15 0 0)",
      surface: "oklch(0.19 0 0)",
      fg: "oklch(0.97 0 0)",
      mutedFg: "oklch(0.7 0 0)",
      primary: "oklch(0.97 0 0)",
      onPrimary: "oklch(0.18 0 0)",
      fill: "oklch(0.24 0 0)",
      border: "oklch(1 0 0 / 14%)",
      ring: "oklch(0.55 0 0)",
      ink: "oklch(0.11 0 0)",
      brand: "oklch(0.8 0.11 82)",
      radius: "0.375rem",
    }),
  },
  {
    id: "charcoal",
    nameAr: "فحمي",
    nameEn: "Charcoal",
    blurbAr: "فحمي هادئ بارد مع لمسة زرقاء خفيفة.",
    blurbEn: "Cool, quiet charcoal with a restrained blue note.",
    dark: true,
    tokens: makeTokens({
      bg: "oklch(0.19 0.006 255)",
      surface: "oklch(0.23 0.006 255)",
      fg: "oklch(0.95 0.004 255)",
      mutedFg: "oklch(0.71 0.01 255)",
      primary: "oklch(0.95 0.004 255)",
      onPrimary: "oklch(0.22 0.006 255)",
      fill: "oklch(0.28 0.008 255)",
      border: "oklch(1 0 0 / 13%)",
      ring: "oklch(0.56 0.02 255)",
      ink: "oklch(0.14 0.005 255)",
      brand: "oklch(0.72 0.09 235)",
      radius: "1rem",
    }),
  },
  {
    id: "forest-night",
    nameAr: "غابة ليلية",
    nameEn: "Forest Night",
    blurbAr: "أخضر ليلي عميق مع ذهبي هادئ — دفء وأمان.",
    blurbEn: "A deep night green with calm gold — warm and reassuring.",
    dark: true,
    tokens: makeTokens({
      bg: "oklch(0.18 0.02 155)",
      surface: "oklch(0.22 0.022 155)",
      fg: "oklch(0.96 0.008 150)",
      mutedFg: "oklch(0.72 0.02 152)",
      primary: "oklch(0.93 0.03 150)",
      onPrimary: "oklch(0.2 0.02 155)",
      fill: "oklch(0.27 0.025 155)",
      border: "oklch(1 0 0 / 14%)",
      ring: "oklch(0.58 0.06 152)",
      ink: "oklch(0.14 0.018 155)",
      brand: "oklch(0.78 0.12 148)",
      radius: "0.75rem",
    }),
  },
  {
    id: "plum-night",
    nameAr: "برقوقي",
    nameEn: "Plum Night",
    blurbAr: "برقوقي ليلي فاخر مع لمسة وردية وحواف دائرية.",
    blurbEn: "A luxurious night plum with a rose highlight and round corners.",
    dark: true,
    tokens: makeTokens({
      bg: "oklch(0.18 0.025 320)",
      surface: "oklch(0.22 0.028 320)",
      fg: "oklch(0.96 0.01 320)",
      mutedFg: "oklch(0.72 0.025 318)",
      primary: "oklch(0.94 0.03 320)",
      onPrimary: "oklch(0.2 0.025 320)",
      fill: "oklch(0.28 0.03 320)",
      border: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.6 0.08 320)",
      ink: "oklch(0.14 0.022 320)",
      brand: "oklch(0.76 0.13 330)",
      radius: "1.125rem",
    }),
  },
];

export const SITE_THEMES: SiteThemePreset[] = [
  {
    id: "original",
    nameAr: "الأصلي — أبيض وأسود",
    nameEn: "Original — black & white",
    blurbAr: "تصميم متجرك الحالي بالضبط: أسود وأبيض فاخر مع لمسة ذهبية.",
    blurbEn:
      "Your store exactly as it is today: luxe black and white with a gold touch.",
    tokens: {},
  },
  {
    id: "royal",
    nameAr: "كحلي ملكي",
    nameEn: "Royal Navy",
    blurbAr: "كحلي عميق مع ذهبي عتيق وحواف حادة أنيقة.",
    blurbEn: "Deep navy with antique gold and crisp, sharp corners.",
    tokens: {
      "--background": "oklch(0.99 0.002 258)",
      "--foreground": "oklch(0.2 0.03 262)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.2 0.03 262)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.2 0.03 262)",
      "--primary": "oklch(0.28 0.06 262)",
      "--primary-foreground": "oklch(0.99 0.002 258)",
      "--secondary": "oklch(0.96 0.008 260)",
      "--secondary-foreground": "oklch(0.24 0.04 262)",
      "--muted": "oklch(0.965 0.008 260)",
      "--muted-foreground": "oklch(0.53 0.02 260)",
      "--accent": "oklch(0.95 0.02 258)",
      "--accent-foreground": "oklch(0.24 0.04 262)",
      "--border": "oklch(0.9 0.012 260)",
      "--input": "oklch(0.9 0.012 260)",
      "--ring": "oklch(0.62 0.05 262)",
      "--ink": "oklch(0.23 0.05 262)",
      "--paper": "oklch(0.98 0.004 258)",
      "--brand": "oklch(0.74 0.11 85)",
      "--radius": "0.25rem",
    },
  },
  {
    id: "sand",
    nameAr: "رملي دافئ",
    nameEn: "Warm Sand",
    blurbAr: "بيج رملي مع لمسة نحاسية — إحساس بوتيك دافئ وأنيق.",
    blurbEn: "Sandy beige with a copper accent — a warm, elegant boutique feel.",
    tokens: {
      "--background": "oklch(0.985 0.008 85)",
      "--foreground": "oklch(0.24 0.02 60)",
      "--card": "oklch(1 0.004 85)",
      "--card-foreground": "oklch(0.24 0.02 60)",
      "--popover": "oklch(1 0.004 85)",
      "--popover-foreground": "oklch(0.24 0.02 60)",
      "--primary": "oklch(0.38 0.05 55)",
      "--primary-foreground": "oklch(0.98 0.01 85)",
      "--secondary": "oklch(0.95 0.015 82)",
      "--secondary-foreground": "oklch(0.28 0.03 60)",
      "--muted": "oklch(0.96 0.014 82)",
      "--muted-foreground": "oklch(0.5 0.03 65)",
      "--accent": "oklch(0.94 0.02 78)",
      "--accent-foreground": "oklch(0.28 0.03 60)",
      "--border": "oklch(0.9 0.018 80)",
      "--input": "oklch(0.9 0.018 80)",
      "--ring": "oklch(0.72 0.06 70)",
      "--ink": "oklch(0.26 0.03 60)",
      "--paper": "oklch(0.98 0.012 80)",
      "--brand": "oklch(0.66 0.11 55)",
      "--radius": "0.375rem",
    },
  },
  {
    id: "emerald",
    nameAr: "زمردي",
    nameEn: "Emerald",
    blurbAr: "أخضر زمردي مع كريمي وحواف مستديرة ناعمة.",
    blurbEn: "Emerald green with cream and soft rounded corners.",
    tokens: {
      "--background": "oklch(0.99 0.004 150)",
      "--foreground": "oklch(0.22 0.03 160)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.22 0.03 160)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.22 0.03 160)",
      "--primary": "oklch(0.32 0.06 162)",
      "--primary-foreground": "oklch(0.99 0.004 150)",
      "--secondary": "oklch(0.96 0.014 155)",
      "--secondary-foreground": "oklch(0.26 0.04 160)",
      "--muted": "oklch(0.96 0.012 155)",
      "--muted-foreground": "oklch(0.5 0.02 160)",
      "--accent": "oklch(0.95 0.02 158)",
      "--accent-foreground": "oklch(0.26 0.04 160)",
      "--border": "oklch(0.9 0.02 155)",
      "--input": "oklch(0.9 0.02 155)",
      "--ring": "oklch(0.66 0.09 158)",
      "--ink": "oklch(0.24 0.05 165)",
      "--paper": "oklch(0.98 0.008 150)",
      "--brand": "oklch(0.68 0.13 155)",
      "--radius": "0.75rem",
    },
  },
  {
    id: "burgundy",
    nameAr: "عنابي",
    nameEn: "Burgundy",
    blurbAr: "عنابي فاخر مع لمسة وردية داكنة وحواف حادة أنيقة.",
    blurbEn: "Luxe burgundy with a deep rosy touch and sharp, elegant corners.",
    tokens: {
      "--background": "oklch(0.99 0.003 20)",
      "--foreground": "oklch(0.24 0.04 15)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.24 0.04 15)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.24 0.04 15)",
      "--primary": "oklch(0.34 0.09 14)",
      "--primary-foreground": "oklch(0.99 0.004 20)",
      "--secondary": "oklch(0.965 0.012 20)",
      "--secondary-foreground": "oklch(0.28 0.05 15)",
      "--muted": "oklch(0.965 0.01 20)",
      "--muted-foreground": "oklch(0.52 0.03 18)",
      "--accent": "oklch(0.955 0.02 18)",
      "--accent-foreground": "oklch(0.28 0.05 15)",
      "--border": "oklch(0.91 0.014 20)",
      "--input": "oklch(0.91 0.014 20)",
      "--ring": "oklch(0.62 0.08 18)",
      "--ink": "oklch(0.28 0.08 15)",
      "--paper": "oklch(0.98 0.006 20)",
      "--brand": "oklch(0.66 0.13 20)",
      "--radius": "0.2rem",
    },
  },
  {
    id: "slate",
    nameAr: "رمادي عصري",
    nameEn: "Modern Graphite",
    blurbAr: "رمادي هادئ مع أزرق فولاذي وحواف دائرية واضحة.",
    blurbEn: "Calm graphite with steel blue and clearly rounded corners.",
    tokens: {
      "--background": "oklch(0.985 0.003 250)",
      "--foreground": "oklch(0.22 0.012 250)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.22 0.012 250)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.22 0.012 250)",
      "--primary": "oklch(0.3 0.02 250)",
      "--primary-foreground": "oklch(0.985 0.003 250)",
      "--secondary": "oklch(0.955 0.005 250)",
      "--secondary-foreground": "oklch(0.26 0.012 250)",
      "--muted": "oklch(0.955 0.005 250)",
      "--muted-foreground": "oklch(0.51 0.012 250)",
      "--accent": "oklch(0.945 0.008 250)",
      "--accent-foreground": "oklch(0.26 0.012 250)",
      "--border": "oklch(0.9 0.006 250)",
      "--input": "oklch(0.9 0.006 250)",
      "--ring": "oklch(0.6 0.03 250)",
      "--ink": "oklch(0.24 0.012 250)",
      "--paper": "oklch(0.985 0.003 250)",
      "--brand": "oklch(0.62 0.09 250)",
      "--radius": "1rem",
    },
  },
  {
    id: "olive",
    nameAr: "زيتوني",
    nameEn: "Olive",
    blurbAr: "زيتوني ستريت وير مع لمسة عسكرية وشكل متوازن.",
    blurbEn: "Streetwear olive with a military touch and a balanced shape.",
    tokens: {
      "--background": "oklch(0.98 0.008 110)",
      "--foreground": "oklch(0.24 0.02 115)",
      "--card": "oklch(1 0.004 110)",
      "--card-foreground": "oklch(0.24 0.02 115)",
      "--popover": "oklch(1 0.004 110)",
      "--popover-foreground": "oklch(0.24 0.02 115)",
      "--primary": "oklch(0.34 0.05 118)",
      "--primary-foreground": "oklch(0.98 0.008 110)",
      "--secondary": "oklch(0.95 0.012 110)",
      "--secondary-foreground": "oklch(0.27 0.03 115)",
      "--muted": "oklch(0.955 0.012 110)",
      "--muted-foreground": "oklch(0.5 0.02 115)",
      "--accent": "oklch(0.94 0.018 110)",
      "--accent-foreground": "oklch(0.27 0.03 115)",
      "--border": "oklch(0.9 0.015 110)",
      "--input": "oklch(0.9 0.015 110)",
      "--ring": "oklch(0.6 0.06 115)",
      "--ink": "oklch(0.27 0.04 120)",
      "--paper": "oklch(0.975 0.01 110)",
      "--brand": "oklch(0.62 0.09 115)",
      "--radius": "0.5rem",
    },
  },
  {
    id: "ivory",
    nameAr: "عاجي ناعم",
    nameEn: "Soft Ivory",
    blurbAr: "عاجي دافئ مع بني موكا وحواف مستديرة جداً.",
    blurbEn: "Warm ivory with mocha brown and very round corners.",
    tokens: {
      "--background": "oklch(0.995 0.005 90)",
      "--foreground": "oklch(0.28 0.015 60)",
      "--card": "oklch(1 0.003 90)",
      "--card-foreground": "oklch(0.28 0.015 60)",
      "--popover": "oklch(1 0.003 90)",
      "--popover-foreground": "oklch(0.28 0.015 60)",
      "--primary": "oklch(0.4 0.03 60)",
      "--primary-foreground": "oklch(0.99 0.006 85)",
      "--secondary": "oklch(0.965 0.008 85)",
      "--secondary-foreground": "oklch(0.31 0.015 60)",
      "--muted": "oklch(0.97 0.008 85)",
      "--muted-foreground": "oklch(0.55 0.02 65)",
      "--accent": "oklch(0.96 0.012 82)",
      "--accent-foreground": "oklch(0.31 0.015 60)",
      "--border": "oklch(0.92 0.01 85)",
      "--input": "oklch(0.92 0.01 85)",
      "--ring": "oklch(0.7 0.03 70)",
      "--ink": "oklch(0.3 0.015 60)",
      "--paper": "oklch(0.99 0.008 85)",
      "--brand": "oklch(0.62 0.06 70)",
      "--radius": "1.25rem",
    },
  },
  {
    id: "midnight",
    nameAr: "ليلي داكن",
    nameEn: "Midnight",
    blurbAr: "تصميم ليلي: الموقع كله بأسود ناعم ولمسة ذهبية.",
    blurbEn: "A night design: the whole store in soft black with a gold touch.",
    dark: true,
    tokens: {
      "--background": "oklch(0.17 0.008 260)",
      "--foreground": "oklch(0.96 0.003 260)",
      "--card": "oklch(0.21 0.008 260)",
      "--card-foreground": "oklch(0.96 0.003 260)",
      "--popover": "oklch(0.2 0.008 260)",
      "--popover-foreground": "oklch(0.96 0.003 260)",
      "--primary": "oklch(0.96 0.003 260)",
      "--primary-foreground": "oklch(0.2 0.008 260)",
      "--secondary": "oklch(0.26 0.008 260)",
      "--secondary-foreground": "oklch(0.96 0.003 260)",
      "--muted": "oklch(0.26 0.008 260)",
      "--muted-foreground": "oklch(0.72 0.01 260)",
      "--accent": "oklch(0.28 0.01 260)",
      "--accent-foreground": "oklch(0.96 0.003 260)",
      "--border": "oklch(1 0 0 / 14%)",
      "--input": "oklch(1 0 0 / 18%)",
      "--ring": "oklch(0.6 0.02 260)",
      "--ink": "oklch(0.13 0.008 260)",
      "--paper": "oklch(0.21 0.008 260)",
      "--brand": "oklch(0.78 0.11 82)",
      "--radius": "0.625rem",
    },
  },
  ...EXTRA_THEMES,
];

/** Falls back to the original look for unknown/blank ids. */
export function siteThemeById(id: string | null | undefined): SiteThemePreset {
  const wanted = (id ?? "").trim();
  return SITE_THEMES.find((preset) => preset.id === wanted) ?? SITE_THEMES[0]!;
}

/**
 * Writes the preset onto `<html>`: previous tokens are removed first, so
 * switching back to the original really restores the built-in stylesheet.
 * Also mirrors the choice into localStorage for the next page load.
 */
export function applySiteTheme(id: string | null | undefined): SiteThemePreset {
  const preset = siteThemeById(id);
  if (typeof document === "undefined") return preset;

  const root = document.documentElement;
  for (const token of SITE_THEME_TOKEN_KEYS) {
    root.style.removeProperty(token);
  }
  for (const [token, value] of Object.entries(preset.tokens)) {
    root.style.setProperty(token, value);
  }
  root.dataset.theme = preset.id;
  root.style.colorScheme = preset.dark ? "dark" : "light";

  try {
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, preset.id);
  } catch {
    /* storage unavailable — the design still applies for this visit */
  }
  return preset;
}

/** The design this browser saw last time, if any. */
export function readStoredSiteTheme(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}
