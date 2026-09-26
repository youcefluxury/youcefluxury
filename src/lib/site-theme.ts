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
 * A dark design is described by its hue rather than by twenty hand-picked
 * colours. Surfaces stay deep and carry only a trace of the hue, so every
 * design reads as rich and dark instead of pale, while the brand accent keeps
 * a contrasting hue for the store's signature mark.
 */
type DarkSpec = {
  /** Base hue of the surfaces and writing. */
  hue: number;
  /** How much colour the surfaces carry — 0 is pure neutral. */
  tint: number;
  /** Hue of the brand accent, often a deliberate contrast. */
  brandHue: number;
  /** Strength of the brand accent. */
  brandChroma: number;
  /** Card corner radius. */
  radius: string;
};

function darkTokens(s: DarkSpec): Record<string, string> {
  const t = s.tint;
  return {
    /* Deep page and card surfaces. */
    "--background": `oklch(0.165 ${(t * 0.3).toFixed(4)} ${s.hue})`,
    "--card": `oklch(0.205 ${(t * 0.38).toFixed(4)} ${s.hue})`,
    "--popover": `oklch(0.215 ${(t * 0.4).toFixed(4)} ${s.hue})`,
    /* Writing. */
    "--foreground": `oklch(0.96 ${(t * 0.16).toFixed(4)} ${s.hue})`,
    "--card-foreground": `oklch(0.96 ${(t * 0.16).toFixed(4)} ${s.hue})`,
    "--popover-foreground": `oklch(0.96 ${(t * 0.16).toFixed(4)} ${s.hue})`,
    /* The action colour is light, so its own label can be dark and crisp. */
    "--primary": `oklch(0.93 ${(t * 0.4).toFixed(4)} ${s.hue})`,
    "--primary-foreground": `oklch(0.2 ${(t * 0.5).toFixed(4)} ${s.hue})`,
    /* Quiet fills sit clearly above the page. */
    "--secondary": `oklch(0.265 ${(t * 0.45).toFixed(4)} ${s.hue})`,
    "--secondary-foreground": `oklch(0.95 ${(t * 0.16).toFixed(4)} ${s.hue})`,
    "--muted": `oklch(0.265 ${(t * 0.45).toFixed(4)} ${s.hue})`,
    "--muted-foreground": `oklch(0.73 ${(t * 0.35).toFixed(4)} ${s.hue})`,
    "--accent": `oklch(0.29 ${(t * 0.5).toFixed(4)} ${s.hue})`,
    "--accent-foreground": `oklch(0.95 ${(t * 0.16).toFixed(4)} ${s.hue})`,
    /* Hairlines read as a soft lift, never a hard line. */
    "--border": "oklch(1 0 0 / 13%)",
    "--input": "oklch(1 0 0 / 16%)",
    "--ring": `oklch(0.6 ${(t * 0.7).toFixed(4)} ${s.hue})`,
    /* Darker than the page, for badges and inverted chips. */
    "--ink": `oklch(0.115 ${(t * 0.25).toFixed(4)} ${s.hue})`,
    "--paper": `oklch(0.205 ${(t * 0.38).toFixed(4)} ${s.hue})`,
    "--brand": `oklch(0.78 ${s.brandChroma} ${s.brandHue})`,
    "--radius": s.radius,
  };
}

const D = (
  hue: number,
  tint: number,
  brandHue: number,
  brandChroma: number,
  radius: string,
): DarkSpec => ({ hue, tint, brandHue, brandChroma, radius });

export const SITE_THEMES: SiteThemePreset[] = [
  {
    id: "original",
    nameAr: "الأسود والذهبي",
    nameEn: "Black & Gold",
    blurbAr: "هوية متجرك: أسود عميق مع لمسة ذهبية كلاسيكية.",
    blurbEn: "Your store identity: deep black with a classic golden touch.",
    dark: true,
    tokens: darkTokens(D(70, 0.1, 82, 0.11, "0.625rem")),
  },
  {
    id: "royal",
    nameAr: "كحلي ملكي",
    nameEn: "Royal Navy",
    blurbAr: "كحلي عميق مع ذهبي عتيق وحواف حادة أنيقة.",
    blurbEn: "Deep navy with antique gold and crisp, sharp corners.",
    dark: true,
    tokens: darkTokens(D(262, 0.075, 85, 0.11, "0.25rem")),
  },
  {
    id: "sand",
    nameAr: "رملي دافئ",
    nameEn: "Warm Sand",
    blurbAr: "بني رملي دافئ مع لمسة نحاسية — بوتيك مسائي.",
    blurbEn: "Warm sand brown with a copper accent — an evening boutique.",
    dark: true,
    tokens: darkTokens(D(55, 0.06, 45, 0.1, "0.375rem")),
  },
  {
    id: "emerald",
    nameAr: "زمردي",
    nameEn: "Emerald",
    blurbAr: "أخضر زمردي غني مع كريمي وحواف مستديرة ناعمة.",
    blurbEn: "Rich emerald green with cream tones and soft round corners.",
    dark: true,
    tokens: darkTokens(D(162, 0.075, 150, 0.12, "0.75rem")),
  },
  {
    id: "burgundy",
    nameAr: "عنابي",
    nameEn: "Burgundy",
    blurbAr: "عنابي فاخر داكن مع لمسة وردية وحواف أنيقة.",
    blurbEn: "Deep, luxurious burgundy with a rose hint and elegant corners.",
    dark: true,
    tokens: darkTokens(D(15, 0.08, 20, 0.13, "0.2rem")),
  },
  {
    id: "slate",
    nameAr: "رمادي عصري",
    nameEn: "Modern Graphite",
    blurbAr: "رمادي فحمي عميق مع أزرق فولاذي وحواف دائرية.",
    blurbEn: "Deep graphite with steel blue and clearly rounded corners.",
    dark: true,
    tokens: darkTokens(D(250, 0.03, 230, 0.09, "1rem")),
  },
  {
    id: "olive",
    nameAr: "زيتوني",
    nameEn: "Olive",
    blurbAr: "أخضر زيتوني داكن بلمسة عسكرية وشكل متوازن.",
    blurbEn: "Dark streetwear olive with a military note and a balanced shape.",
    dark: true,
    tokens: darkTokens(D(118, 0.06, 100, 0.1, "0.5rem")),
  },
  {
    id: "ivory",
    nameAr: "عاجي داكن",
    nameEn: "Dark Ivory",
    blurbAr: "عاجي دافئ مريح للعين مع بني موكا وحواف دائرية.",
    blurbEn: "A warm, easy-on-the-eyes ivory with mocha brown and round corners.",
    dark: true,
    tokens: darkTokens(D(75, 0.04, 60, 0.07, "1.25rem")),
  },
  {
    id: "midnight",
    nameAr: "ليلي داكن",
    nameEn: "Midnight",
    blurbAr: "أسود ناعم هادئ مع لمسة ذهبية هادئة.",
    blurbEn: "Soft, quiet black with a calm gold touch.",
    dark: true,
    tokens: darkTokens(D(260, 0.02, 82, 0.11, "0.625rem")),
  },
  {
    id: "honey",
    nameAr: "عسلي دافئ",
    nameEn: "Warm Honey",
    blurbAr: "عسلي ذهبي داكن مع بنّي متباين وحواف مستديرة.",
    blurbEn: "Dark honey gold with deep brown and softly rounded corners.",
    dark: true,
    tokens: darkTokens(D(68, 0.085, 80, 0.14, "0.5rem")),
  },
  {
    id: "forest",
    nameAr: "غابة هادئة",
    nameEn: "Calm Forest",
    blurbAr: "أخضر غابة عميق مع ذهبي هادئ — دفء وثقة.",
    blurbEn: "Deep forest green with calm gold — warm and assured.",
    dark: true,
    tokens: darkTokens(D(155, 0.08, 90, 0.12, "0.625rem")),
  },
  {
    id: "crimson",
    nameAr: "قرمزي",
    nameEn: "Crimson",
    blurbAr: "قرمزي عميق واثق مع ورد داكن وحواف حادة.",
    blurbEn: "A deep, confident crimson with dark rose and sharp corners.",
    dark: true,
    tokens: darkTokens(D(22, 0.09, 30, 0.15, "0.25rem")),
  },
  {
    id: "azure",
    nameAr: "أزرق سماوي",
    nameEn: "Azure",
    blurbAr: "أزرق سماوي عميق مع فيروزي وحواف دائرية.",
    blurbEn: "Deep azure blue with a turquoise note and round corners.",
    dark: true,
    tokens: darkTokens(D(248, 0.075, 195, 0.12, "0.875rem")),
  },
  {
    id: "lavender",
    nameAr: "لافندر",
    nameEn: "Lavender",
    blurbAr: "بنفسجي لافندر ليلي مع وردي وحواف مستديرة.",
    blurbEn: "Night lavender with a rose highlight and soft round corners.",
    dark: true,
    tokens: darkTokens(D(300, 0.075, 330, 0.13, "1rem")),
  },
  {
    id: "teal",
    nameAr: "أزرق مخضر",
    nameEn: "Teal",
    blurbAr: "أزرق مخضر بحري عميق مع ذهبي وحواف متوازنة.",
    blurbEn: "Deep ocean teal with gold and a balanced, easy shape.",
    dark: true,
    tokens: darkTokens(D(200, 0.07, 85, 0.11, "0.75rem")),
  },
  {
    id: "cocoa",
    nameAr: "كاكاو",
    nameEn: "Cocoa",
    blurbAr: "بني كاكاو غني وداكن مع لمسة نحاسية دافئة.",
    blurbEn: "Rich, dark cocoa brown with a warm copper highlight.",
    dark: true,
    tokens: darkTokens(D(52, 0.07, 45, 0.1, "0.625rem")),
  },
  {
    id: "rose",
    nameAr: "وردي داكن",
    nameEn: "Deep Rose",
    blurbAr: "وردي داكن راقٍ مع توت وحواف ناعمة.",
    blurbEn: "Refined deep rose with a berry tone and soft corners.",
    dark: true,
    tokens: darkTokens(D(8, 0.07, 340, 0.13, "1.125rem")),
  },
  {
    id: "noir",
    nameAr: "أسود فاخر",
    nameEn: "Luxe Noir",
    blurbAr: "أسود نقي فاخر للموقع كله مع ذهب عميق.",
    blurbEn: "Pure luxe black across the whole store with deep gold.",
    dark: true,
    tokens: darkTokens(D(0, 0, 82, 0.12, "0.375rem")),
  },
  {
    id: "charcoal",
    nameAr: "فحمي",
    nameEn: "Charcoal",
    blurbAr: "فحمي بارد عميق مع لمسة زرقاء هادئة.",
    blurbEn: "Deep, cool charcoal with a restrained blue note.",
    dark: true,
    tokens: darkTokens(D(255, 0.025, 230, 0.1, "1rem")),
  },
  {
    id: "forest-night",
    nameAr: "غابة ليلية",
    nameEn: "Forest Night",
    blurbAr: "أخضر ليلي عميق مع ذهبي هادئ — دفء وأمان.",
    blurbEn: "A deep night green with calm gold — warm and reassuring.",
    dark: true,
    tokens: darkTokens(D(158, 0.08, 90, 0.12, "0.75rem")),
  },
  {
    id: "plum-night",
    nameAr: "برقوقي",
    nameEn: "Plum Night",
    blurbAr: "برقوقي ليلي فاخر مع وردي وحواف دائرية.",
    blurbEn: "A luxurious night plum with a rose highlight and round corners.",
    dark: true,
    tokens: darkTokens(D(320, 0.08, 340, 0.13, "1.125rem")),
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
