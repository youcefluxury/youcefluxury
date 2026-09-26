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
