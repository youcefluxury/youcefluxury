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
export const SITE_THEME_STORAGE_KEY = "store.site-theme";

/** The two ways a design can be worn: a bright page or a dark one. */
export const SITE_THEME_MODES = ["light", "dark"] as const;
export type SiteThemeMode = (typeof SITE_THEME_MODES)[number];

/** New designs start dark, which is the store's original look. */
export const DEFAULT_SITE_THEME_MODE: SiteThemeMode = "dark";

/** localStorage key for the light/dark choice. */
export const SITE_THEME_MODE_STORAGE_KEY = "store.site-mode";

/** Anything unknown falls back to the dark mode. */
export function normalizeSiteMode(
  mode: string | null | undefined,
): SiteThemeMode {
  return mode === "light" ? "light" : "dark";
}

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
  /**
   * Both palettes for this design, built from the same hue spec:
   * `light` is the bright page, `dark` the deep one. The admin picks
   * which one the whole storefront wears.
   */
  tokens: Record<SiteThemeMode, Record<string, string>>;
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

function vividTokens(
  s: VividSpec,
  mode: SiteThemeMode,
): Record<string, string> {
  const c = s.chroma;

  if (mode === "light") {
    return {
      /* Bright, luminous surfaces: the page reads white, never grey. */
      "--background": `oklch(0.975 ${(c * 0.35).toFixed(4)} ${s.hue})`,
      "--card": `oklch(0.995 ${(c * 0.14).toFixed(4)} ${s.hue})`,
      "--popover": `oklch(1 ${(c * 0.07).toFixed(4)} ${s.hue})`,
      /* Deep writing, still carrying the design's hue. */
      "--foreground": `oklch(0.2 ${(c * 0.7).toFixed(4)} ${s.hue})`,
      "--card-foreground": `oklch(0.2 ${(c * 0.7).toFixed(4)} ${s.hue})`,
      "--popover-foreground": `oklch(0.2 ${(c * 0.7).toFixed(4)} ${s.hue})`,
      /* The action colour stays vivid, with light writing on top. */
      "--primary": `oklch(0.62 ${s.actionChroma.toFixed(4)} ${s.actionHue})`,
      "--primary-foreground": `oklch(0.99 ${(c * 0.12).toFixed(4)} ${s.hue})`,
      "--secondary": `oklch(0.93 ${(c * 0.55).toFixed(4)} ${s.hue})`,
      "--secondary-foreground": `oklch(0.24 ${(c * 0.75).toFixed(4)} ${s.hue})`,
      "--muted": `oklch(0.94 ${(c * 0.5).toFixed(4)} ${s.hue})`,
      "--muted-foreground": `oklch(0.44 ${(c * 0.55).toFixed(4)} ${s.hue})`,
      "--accent": `oklch(0.9 ${(c * 0.9).toFixed(4)} ${s.hue})`,
      "--accent-foreground": `oklch(0.24 ${(c * 0.8).toFixed(4)} ${s.hue})`,
      /* Hairlines read as a soft shade, never a hard line. */
      "--border": `oklch(0.2 ${(c * 0.7).toFixed(4)} ${s.hue} / 16%)`,
      "--input": `oklch(0.2 ${(c * 0.7).toFixed(4)} ${s.hue} / 14%)`,
      "--ring": `oklch(0.62 ${(s.actionChroma * 0.85).toFixed(4)} ${s.actionHue})`,
      /* The inverted band: near-black with light writing, both modes. */
      "--ink": `oklch(0.18 ${(c * 0.75).toFixed(4)} ${s.hue})`,
      "--paper": `oklch(0.985 ${(c * 0.12).toFixed(4)} ${s.hue})`,
      /* The signature accent. */
      "--brand": `oklch(0.6 ${(s.brandChroma * 1.1).toFixed(4)} ${s.brandHue})`,
      "--radius": s.radius,
    };
  }

  return {
    /* Deep, genuinely tinted surfaces. */
    "--background": `oklch(0.175 ${(c * 0.95).toFixed(4)} ${s.hue})`,
    "--card": `oklch(0.225 ${(c * 1.05).toFixed(4)} ${s.hue})`,
    "--popover": `oklch(0.235 ${(c * 1.1).toFixed(4)} ${s.hue})`,
    /* Writing. */
    "--foreground": `oklch(0.975 ${(c * 0.22).toFixed(4)} ${s.hue})`,
    "--card-foreground": `oklch(0.975 ${(c * 0.22).toFixed(4)} ${s.hue})`,
    "--popover-foreground": `oklch(0.975 ${(c * 0.22).toFixed(4)} ${s.hue})`,
    /* The action colour: vivid and saturated, with dark writing on top. */
    "--primary": `oklch(0.82 ${(s.actionChroma * 1.05).toFixed(4)} ${s.actionHue})`,
    "--primary-foreground": `oklch(0.18 ${(c * 0.8).toFixed(4)} ${s.hue})`,
    /* Quiet fills read clearly above the page. */
    "--secondary": `oklch(0.295 ${(c * 1.05).toFixed(4)} ${s.hue})`,
    "--secondary-foreground": `oklch(0.97 ${(c * 0.22).toFixed(4)} ${s.hue})`,
    "--muted": `oklch(0.295 ${(c * 1.05).toFixed(4)} ${s.hue})`,
    "--muted-foreground": `oklch(0.79 ${(c * 0.5).toFixed(4)} ${s.hue})`,
    "--accent": `oklch(0.35 ${(c * 1.25).toFixed(4)} ${s.hue})`,
    "--accent-foreground": `oklch(0.97 ${(c * 0.22).toFixed(4)} ${s.hue})`,
    /* Hairlines stay a soft lift, never a hard line. */
    "--border": "oklch(1 0 0 / 16%)",
    "--input": "oklch(1 0 0 / 19%)",
    "--ring": `oklch(0.72 ${(s.actionChroma * 0.8).toFixed(4)} ${s.actionHue})`,
    /* Darker than the page, for badges and inverted chips. */
    "--ink": `oklch(0.12 ${(c * 0.65).toFixed(4)} ${s.hue})`,
    "--paper": `oklch(0.975 ${(c * 0.1).toFixed(4)} ${s.hue})`,
    /* The signature accent. */
    "--brand": `oklch(0.82 ${(s.brandChroma * 1.05).toFixed(4)} ${s.brandHue})`,
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
    tokens: {
      light: vividTokens(V(70, 0.035, 82, 0.16, 82, 0.16, "0.625rem"), "light"),
      dark: vividTokens(V(70, 0.035, 82, 0.16, 82, 0.16, "0.625rem"), "dark"),
    },
  },
  {
    id: "honey",
    nameAr: "عسلي",
    nameEn: "Honey",
    blurbAr: "أصفر عسلي قوي حقيقي — ليس باهتاً أبداً.",
    blurbEn: "A real, strong honey yellow — never washed out.",
    tokens: {
      light: vividTokens(V(95, 0.055, 95, 0.175, 85, 0.16, "0.5rem"), "light"),
      dark: vividTokens(V(95, 0.055, 95, 0.175, 85, 0.16, "0.5rem"), "dark"),
    },
  },
  {
    id: "royal",
    nameAr: "كحلي ملكي",
    nameEn: "Royal Navy",
    blurbAr: "كحلي عميق مع ذهبي عتيق قوي وحواف حادة.",
    blurbEn: "Deep navy with a rich antique gold and sharp corners.",
    tokens: {
      light: vividTokens(
        V(262, 0.062, 85, 0.155, 85, 0.15, "0.25rem"),
        "light",
      ),
      dark: vividTokens(V(262, 0.062, 85, 0.155, 85, 0.15, "0.25rem"), "dark"),
    },
  },
  {
    id: "forest",
    nameAr: "غابة",
    nameEn: "Forest",
    blurbAr: "أخضر غابة مشبع وقوي مع ذهبي دافئ.",
    blurbEn: "A saturated, confident forest green with warm gold.",
    tokens: {
      light: vividTokens(
        V(155, 0.072, 152, 0.165, 90, 0.15, "0.625rem"),
        "light",
      ),
      dark: vividTokens(
        V(155, 0.072, 152, 0.165, 90, 0.15, "0.625rem"),
        "dark",
      ),
    },
  },
  {
    id: "emerald",
    nameAr: "زمردي",
    nameEn: "Emerald",
    blurbAr: "أخضر زمردي غني ومشبّع مع حواف مستديرة.",
    blurbEn: "Rich, saturated emerald with soft rounded corners.",
    tokens: {
      light: vividTokens(
        V(162, 0.075, 158, 0.17, 150, 0.16, "0.75rem"),
        "light",
      ),
      dark: vividTokens(V(162, 0.075, 158, 0.17, 150, 0.16, "0.75rem"), "dark"),
    },
  },
  {
    id: "crimson",
    nameAr: "قرمزي",
    nameEn: "Crimson",
    blurbAr: "أحمر قرمزي قوي وحيوي بحواف حادة.",
    blurbEn: "A bold, vivid crimson with sharp corners.",
    tokens: {
      light: vividTokens(V(22, 0.088, 25, 0.19, 30, 0.17, "0.25rem"), "light"),
      dark: vividTokens(V(22, 0.088, 25, 0.19, 30, 0.17, "0.25rem"), "dark"),
    },
  },
  {
    id: "burgundy",
    nameAr: "عنابي",
    nameEn: "Burgundy",
    blurbAr: "عنابي فاخر مشبع مع لمسة وردية قوية.",
    blurbEn: "Saturated, luxurious burgundy with a strong rose note.",
    tokens: {
      light: vividTokens(V(15, 0.08, 18, 0.175, 20, 0.16, "0.2rem"), "light"),
      dark: vividTokens(V(15, 0.08, 18, 0.175, 20, 0.16, "0.2rem"), "dark"),
    },
  },
  {
    id: "azure",
    nameAr: "أزرق سماوي",
    nameEn: "Azure",
    blurbAr: "أزرق سماوي صافٍ ومشبّع مع فيروزي.",
    blurbEn: "Clean, saturated azure blue with a turquoise note.",
    tokens: {
      light: vividTokens(
        V(248, 0.075, 245, 0.155, 195, 0.14, "0.875rem"),
        "light",
      ),
      dark: vividTokens(
        V(248, 0.075, 245, 0.155, 195, 0.14, "0.875rem"),
        "dark",
      ),
    },
  },
  {
    id: "teal",
    nameAr: "أزرق مخضر",
    nameEn: "Teal",
    blurbAr: "أزرق مخضر بحري عميق ومشبّع.",
    blurbEn: "Deep, saturated ocean teal.",
    tokens: {
      light: vividTokens(V(200, 0.07, 195, 0.15, 85, 0.15, "0.75rem"), "light"),
      dark: vividTokens(V(200, 0.07, 195, 0.15, 85, 0.15, "0.75rem"), "dark"),
    },
  },
  {
    id: "lavender",
    nameAr: "لافندر",
    nameEn: "Lavender",
    blurbAr: "بنفسجي لافندر قوي مع وردي صارخ.",
    blurbEn: "A bold lavender purple with a vivid rose accent.",
    tokens: {
      light: vividTokens(V(300, 0.078, 302, 0.17, 330, 0.17, "1rem"), "light"),
      dark: vividTokens(V(300, 0.078, 302, 0.17, 330, 0.17, "1rem"), "dark"),
    },
  },
  {
    id: "plum-night",
    nameAr: "برقوقي",
    nameEn: "Plum Night",
    blurbAr: "برقوقي ليلي مشبع مع وردي قوي.",
    blurbEn: "Saturated night plum with a strong rose accent.",
    tokens: {
      light: vividTokens(
        V(320, 0.082, 322, 0.175, 340, 0.17, "1.125rem"),
        "light",
      ),
      dark: vividTokens(
        V(320, 0.082, 322, 0.175, 340, 0.17, "1.125rem"),
        "dark",
      ),
    },
  },
  {
    id: "rose",
    nameAr: "وردي",
    nameEn: "Rose",
    blurbAr: "وردي عميق ومشبّع مع توت داكن.",
    blurbEn: "Deep, saturated rose with a dark berry note.",
    tokens: {
      light: vividTokens(V(8, 0.075, 6, 0.165, 340, 0.16, "1.125rem"), "light"),
      dark: vividTokens(V(8, 0.075, 6, 0.165, 340, 0.16, "1.125rem"), "dark"),
    },
  },
  {
    id: "olive",
    nameAr: "زيتوني",
    nameEn: "Olive",
    blurbAr: "أخضر زيتوني داكن وقوي بلمسة عسكرية.",
    blurbEn: "A strong, dark olive with a military note.",
    tokens: {
      light: vividTokens(
        V(118, 0.065, 112, 0.145, 100, 0.13, "0.5rem"),
        "light",
      ),
      dark: vividTokens(V(118, 0.065, 112, 0.145, 100, 0.13, "0.5rem"), "dark"),
    },
  },
  {
    id: "sand",
    nameAr: "رملي",
    nameEn: "Sand",
    blurbAr: "رملي ذهبي دافئ وقوي بنحاس متباين.",
    blurbEn: "Warm, strong sand gold with contrasting copper.",
    tokens: {
      light: vividTokens(
        V(60, 0.055, 50, 0.145, 45, 0.14, "0.375rem"),
        "light",
      ),
      dark: vividTokens(V(60, 0.055, 50, 0.145, 45, 0.14, "0.375rem"), "dark"),
    },
  },
  {
    id: "cocoa",
    nameAr: "كاكاو",
    nameEn: "Cocoa",
    blurbAr: "بني كاكاو غني ومشبّع مع نحاس دافئ.",
    blurbEn: "Rich, saturated cocoa brown with warm copper.",
    tokens: {
      light: vividTokens(
        V(52, 0.062, 48, 0.145, 45, 0.14, "0.625rem"),
        "light",
      ),
      dark: vividTokens(V(52, 0.062, 48, 0.145, 45, 0.14, "0.625rem"), "dark"),
    },
  },
  {
    id: "ivory",
    nameAr: "عاجي",
    nameEn: "Ivory",
    blurbAr: "عاجي دافئ مريح للعين مع بني موكا.",
    blurbEn: "A warm, easy-on-the-eyes ivory with mocha brown.",
    tokens: {
      light: vividTokens(V(78, 0.05, 68, 0.13, 60, 0.12, "1.25rem"), "light"),
      dark: vividTokens(V(78, 0.05, 68, 0.13, 60, 0.12, "1.25rem"), "dark"),
    },
  },
  {
    id: "midnight",
    nameAr: "ليلي داكن",
    nameEn: "Midnight",
    blurbAr: "أسود ناعم مع ذهبي هادئ وقوي.",
    blurbEn: "Soft black with a calm but rich gold.",
    tokens: {
      light: vividTokens(
        V(262, 0.03, 82, 0.155, 82, 0.15, "0.625rem"),
        "light",
      ),
      dark: vividTokens(V(262, 0.03, 82, 0.155, 82, 0.15, "0.625rem"), "dark"),
    },
  },
  {
    id: "forest-night",
    nameAr: "غابة ليلية",
    nameEn: "Forest Night",
    blurbAr: "أخضر ليلي عميق ومشبّع مع ذهبي.",
    blurbEn: "A deep, saturated night green with gold.",
    tokens: {
      light: vividTokens(
        V(158, 0.078, 152, 0.165, 90, 0.15, "0.75rem"),
        "light",
      ),
      dark: vividTokens(V(158, 0.078, 152, 0.165, 90, 0.15, "0.75rem"), "dark"),
    },
  },
  {
    id: "slate",
    nameAr: "فحمي",
    nameEn: "Graphite",
    blurbAr: "فحمي بارد عميق مع أزرق فولاذي قوي.",
    blurbEn: "Deep cool graphite with a strong steel blue.",
    tokens: {
      light: vividTokens(V(250, 0.032, 240, 0.115, 230, 0.11, "1rem"), "light"),
      dark: vividTokens(V(250, 0.032, 240, 0.115, 230, 0.11, "1rem"), "dark"),
    },
  },
  {
    id: "charcoal",
    nameAr: "فحمي أنيق",
    nameEn: "Charcoal",
    blurbAr: "فحمي بارد أنيق مع لمسة زرقية هادئة.",
    blurbEn: "Elegant cool charcoal with a calm blue note.",
    tokens: {
      light: vividTokens(V(255, 0.028, 245, 0.105, 230, 0.1, "1rem"), "light"),
      dark: vividTokens(V(255, 0.028, 245, 0.105, 230, 0.1, "1rem"), "dark"),
    },
  },
  {
    id: "noir",
    nameAr: "أسود فاخر",
    nameEn: "Luxe Noir",
    blurbAr: "أسود نقي للموقع كله مع ذهب قوي.",
    blurbEn: "Pure black across the store with a rich gold.",
    tokens: {
      light: vividTokens(V(0, 0.012, 82, 0.16, 82, 0.16, "0.375rem"), "light"),
      dark: vividTokens(V(0, 0.012, 82, 0.16, 82, 0.16, "0.375rem"), "dark"),
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
export function applySiteTheme(
  id: string | null | undefined,
  mode?: SiteThemeMode | null,
): SiteThemePreset {
  const preset = siteThemeById(id);
  const chosen = normalizeSiteMode(mode);
  if (typeof document === "undefined") return preset;

  const root = document.documentElement;
  for (const token of SITE_THEME_TOKEN_KEYS) {
    root.style.removeProperty(token);
  }
  for (const [token, value] of Object.entries(preset.tokens[chosen])) {
    root.style.setProperty(token, value);
  }
  root.dataset.theme = preset.id;
  root.dataset.mode = chosen;
  /* The class Tailwind's `dark:` variants listen to. */
  root.classList.toggle("dark", chosen === "dark");
  root.style.colorScheme = chosen;

  try {
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, preset.id);
    window.localStorage.setItem(SITE_THEME_MODE_STORAGE_KEY, chosen);
  } catch {
    /* storage unavailable - the design still applies for this visit */
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

/** The light/dark mode this browser saw last time, if any. */
export function readStoredSiteMode(): SiteThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SITE_THEME_MODE_STORAGE_KEY);
    return raw === null ? null : normalizeSiteMode(raw);
  } catch {
    return null;
  }
}
