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
 * A design is described by its hue and how strongly it is chroma-saturated,
 * never by twenty hand-picked colours.
 *
 * Surfaces stay dark and carry a real amount of the theme's hue, so a "yellow"
 * design actually reads yellow instead of grey. The action colour is a vivid,
 * saturated version of the hue carrying near-black writing — that is what makes
 * the palette feel strong while keeping every button readable.
 */
type VividSpec = {
  /** Base hue of the surfaces and writing. */
  hue: number;
  /** Chroma of the surfaces — how much colour the whole page carries. */
  chroma: number;
  /** Hue + chroma of the vivid action colour (buttons). */
  actionHue: number;
  actionChroma: number;
  /** Hue + chroma of the store's signature accent. */
  brandHue: number;
  brandChroma: number;
  /** Card corner radius. */
  radius: string;
};

function vividTokens(s: VividSpec): Record<string, string> {
  const c = s.chroma;
  return {
    /* Deep, genuinely tinted surfaces. */
    "--background": `oklch(0.17 ${(c * 0.85).toFixed(4)} ${s.hue})`,
    "--card": `oklch(0.215 ${(c * 0.95).toFixed(4)} ${s.hue})`,
    "--popover": `oklch(0.225 ${c.toFixed(4)} ${s.hue})`,
    /* Writing. */
    "--foreground": `oklch(0.965 ${(c * 0.25).toFixed(4)} ${s.hue})`,
    "--card-foreground": `oklch(0.965 ${(c * 0.25).toFixed(4)} ${s.hue})`,
    "--popover-foreground": `oklch(0.965 ${(c * 0.25).toFixed(4)} ${s.hue})`,
    /* The action colour: vivid and saturated, with dark writing on top. */
    "--primary": `oklch(0.8 ${s.actionChroma} ${s.actionHue})`,
    "--primary-foreground": `oklch(0.17 ${(c * 0.8).toFixed(4)} ${s.hue})`,
    /* Quiet fills read clearly above the page. */
    "--secondary": `oklch(0.28 ${c.toFixed(4)} ${s.hue})`,
    "--secondary-foreground": `oklch(0.96 ${(c * 0.25).toFixed(4)} ${s.hue})`,
    "--muted": `oklch(0.28 ${c.toFixed(4)} ${s.hue})`,
    "--muted-foreground": `oklch(0.76 ${(c * 0.45).toFixed(4)} ${s.hue})`,
    "--accent": `oklch(0.33 ${(c * 1.15).toFixed(4)} ${s.hue})`,
    "--accent-foreground": `oklch(0.96 ${(c * 0.25).toFixed(4)} ${s.hue})`,
    /* Hairlines stay a soft lift, never a hard line. */
    "--border": "oklch(1 0 0 / 14%)",
    "--input": "oklch(1 0 0 / 17%)",
    "--ring": `oklch(0.68 ${(s.actionChroma * 0.7).toFixed(4)} ${s.actionHue})`,
    /* Darker than the page, for badges and inverted chips. */
    "--ink": `oklch(0.115 ${(c * 0.6).toFixed(4)} ${s.hue})`,
    "--paper": `oklch(0.215 ${(c * 0.95).toFixed(4)} ${s.hue})`,
    /* The signature accent. */
    "--brand": `oklch(0.8 ${s.brandChroma} ${s.brandHue})`,
    "--radius": s.radius,
  };
}

const V = (
  hue: number,
  chroma: number,
  actionHue: number,
  actionChroma: number,
  brandHue: number,
  brandChroma: number,
  radius: string,
): VividSpec => ({
  hue,
  chroma,
  actionHue,
  actionChroma,
  brandHue,
  brandChroma,
  radius,
});

export const SITE_THEMES: SiteThemePreset[] = [
  {
    id: "original",
    nameAr: "الأسود والذهبي",
    nameEn: "Black & Gold",
    blurbAr: "هوية متجرك: أسود عميق بلمسة ذهبية قويّة.",
    blurbEn: "Your store identity: deep black with a strong golden accent.",
    dark: true,
    tokens: vividTokens(V(70, 0.035, 82, 0.16, 82, 0.16, "0.625rem")),
  },
  {
    id: "honey",
    nameAr: "عسلي",
    nameEn: "Honey",
    blurbAr: "أصفر عسلي قوي حقيقي — ليس باهتاً أبداً.",
    blurbEn: "A real, strong honey yellow — never washed out.",
    dark: true,
    tokens: vividTokens(V(95, 0.055, 95, 0.175, 85, 0.16, "0.5rem")),
  },
  {
    id: "royal",
    nameAr: "كحلي ملكي",
    nameEn: "Royal Navy",
    blurbAr: "كحلي عميق مع ذهبي عتيق قوي وحواف حادة.",
    blurbEn: "Deep navy with a rich antique gold and sharp corners.",
    dark: true,
    tokens: vividTokens(V(262, 0.062, 85, 0.155, 85, 0.15, "0.25rem")),
  },
  {
    id: "forest",
    nameAr: "غابة",
    nameEn: "Forest",
    blurbAr: "أخضر غابة مشبع وقوي مع ذهبي دافئ.",
    blurbEn: "A saturated, confident forest green with warm gold.",
    dark: true,
    tokens: vividTokens(V(155, 0.072, 152, 0.165, 90, 0.15, "0.625rem")),
  },
  {
    id: "emerald",
    nameAr: "زمردي",
    nameEn: "Emerald",
    blurbAr: "أخضر زمردي غني ومشبّع مع حواف مستديرة.",
    blurbEn: "Rich, saturated emerald with soft rounded corners.",
    dark: true,
    tokens: vividTokens(V(162, 0.075, 158, 0.17, 150, 0.16, "0.75rem")),
  },
  {
    id: "crimson",
    nameAr: "قرمزي",
    nameEn: "Crimson",
    blurbAr: "أحمر قرمزي قوي وحيوي بحواف حادة.",
    blurbEn: "A bold, vivid crimson with sharp corners.",
    dark: true,
    tokens: vividTokens(V(22, 0.088, 25, 0.19, 30, 0.17, "0.25rem")),
  },
  {
    id: "burgundy",
    nameAr: "عنابي",
    nameEn: "Burgundy",
    blurbAr: "عنابي فاخر مشبع مع لمسة وردية قوية.",
    blurbEn: "Saturated, luxurious burgundy with a strong rose note.",
    dark: true,
    tokens: vividTokens(V(15, 0.08, 18, 0.175, 20, 0.16, "0.2rem")),
  },
  {
    id: "azure",
    nameAr: "أزرق سماوي",
    nameEn: "Azure",
    blurbAr: "أزرق سماوي صافٍ ومشبّع مع فيروزي.",
    blurbEn: "Clean, saturated azure blue with a turquoise note.",
    dark: true,
    tokens: vividTokens(V(248, 0.075, 245, 0.155, 195, 0.14, "0.875rem")),
  },
  {
    id: "teal",
    nameAr: "أزرق مخضر",
    nameEn: "Teal",
    blurbAr: "أزرق مخضر بحري عميق ومشبّع.",
    blurbEn: "Deep, saturated ocean teal.",
    dark: true,
    tokens: vividTokens(V(200, 0.07, 195, 0.15, 85, 0.15, "0.75rem")),
  },
  {
    id: "lavender",
    nameAr: "لافندر",
    nameEn: "Lavender",
    blurbAr: "بنفسجي لافندر قوي مع وردي صارخ.",
    blurbEn: "A bold lavender purple with a vivid rose accent.",
    dark: true,
    tokens: vividTokens(V(300, 0.078, 302, 0.17, 330, 0.17, "1rem")),
  },
  {
    id: "plum-night",
    nameAr: "برقوقي",
    nameEn: "Plum Night",
    blurbAr: "برقوقي ليلي مشبع مع وردي قوي.",
    blurbEn: "Saturated night plum with a strong rose accent.",
    dark: true,
    tokens: vividTokens(V(320, 0.082, 322, 0.175, 340, 0.17, "1.125rem")),
  },
  {
    id: "rose",
    nameAr: "وردي",
    nameEn: "Rose",
    blurbAr: "وردي عميق ومشبّع مع توت داكن.",
    blurbEn: "Deep, saturated rose with a dark berry note.",
    dark: true,
    tokens: vividTokens(V(8, 0.075, 6, 0.165, 340, 0.16, "1.125rem")),
  },
  {
    id: "olive",
    nameAr: "زيتوني",
    nameEn: "Olive",
    blurbAr: "أخضر زيتوني داكن وقوي بلمسة عسكرية.",
    blurbEn: "A strong, dark olive with a military note.",
    dark: true,
    tokens: vividTokens(V(118, 0.065, 112, 0.145, 100, 0.13, "0.5rem")),
  },
  {
    id: "sand",
    nameAr: "رملي",
    nameEn: "Sand",
    blurbAr: "رملي ذهبي دافئ وقوي بنحاس متباين.",
    blurbEn: "Warm, strong sand gold with contrasting copper.",
    dark: true,
    tokens: vividTokens(V(60, 0.055, 50, 0.145, 45, 0.14, "0.375rem")),
  },
  {
    id: "cocoa",
    nameAr: "كاكاو",
    nameEn: "Cocoa",
    blurbAr: "بني كاكاو غني ومشبّع مع نحاس دافئ.",
    blurbEn: "Rich, saturated cocoa brown with warm copper.",
    dark: true,
    tokens: vividTokens(V(52, 0.062, 48, 0.145, 45, 0.14, "0.625rem")),
  },
  {
    id: "ivory",
    nameAr: "عاجي",
    nameEn: "Ivory",
    blurbAr: "عاجي دافئ مريح للعين مع بني موكا.",
    blurbEn: "A warm, easy-on-the-eyes ivory with mocha brown.",
    dark: true,
    tokens: vividTokens(V(78, 0.05, 68, 0.13, 60, 0.12, "1.25rem")),
  },
  {
    id: "midnight",
    nameAr: "ليلي داكن",
    nameEn: "Midnight",
    blurbAr: "أسود ناعم مع ذهبي هادئ وقوي.",
    blurbEn: "Soft black with a calm but rich gold.",
    dark: true,
    tokens: vividTokens(V(262, 0.03, 82, 0.155, 82, 0.15, "0.625rem")),
  },
  {
    id: "forest-night",
    nameAr: "غابة ليلية",
    nameEn: "Forest Night",
    blurbAr: "أخضر ليلي عميق ومشبّع مع ذهبي.",
    blurbEn: "A deep, saturated night green with gold.",
    dark: true,
    tokens: vividTokens(V(158, 0.078, 152, 0.165, 90, 0.15, "0.75rem")),
  },
  {
    id: "slate",
    nameAr: "فحمي",
    nameEn: "Graphite",
    blurbAr: "فحمي بارد عميق مع أزرق فولاذي قوي.",
    blurbEn: "Deep cool graphite with a strong steel blue.",
    dark: true,
    tokens: vividTokens(V(250, 0.032, 240, 0.115, 230, 0.11, "1rem")),
  },
  {
    id: "charcoal",
    nameAr: "فحمي أنيق",
    nameEn: "Charcoal",
    blurbAr: "فحمي بارد أنيق مع لمسة زرقية هادئة.",
    blurbEn: "Elegant cool charcoal with a calm blue note.",
    dark: true,
    tokens: vividTokens(V(255, 0.028, 245, 0.105, 230, 0.1, "1rem")),
  },
  {
    id: "noir",
    nameAr: "أسود فاخر",
    nameEn: "Luxe Noir",
    blurbAr: "أسود نقي للموقع كله مع ذهب قوي.",
    blurbEn: "Pure black across the store with a rich gold.",
    dark: true,
    tokens: vividTokens(V(0, 0.012, 82, 0.16, 82, 0.16, "0.375rem")),
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
