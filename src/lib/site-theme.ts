/**
 * The store's one site design, plus the way it can be worn.
 *
 * The design is a list of CSS custom properties written straight onto
 * `<html>`, so the whole storefront — header, footer, buttons, cards, corner
 * radius — restyles at once without touching any product or order. It is saved
 * in the database *and* mirrored into localStorage, so the first paint after a
 * reload already wears it.
 */

/** localStorage key shared with the instant-apply step in the provider. */
export const SITE_THEME_STORAGE_KEY = "store.site-theme";

/**
 * The two ways the design can be worn: a bright page or a deep one.
 */
export const SITE_THEME_MODES = ["light", "dark"] as const;
export type SiteThemeMode = (typeof SITE_THEME_MODES)[number];

/** The store opens on its deep face, which is the classic boutique look. */
export const DEFAULT_SITE_THEME_MODE: SiteThemeMode = "dark";

/** localStorage key for the light / dark choice. */
export const SITE_THEME_MODE_STORAGE_KEY = "store.site-mode";

/** Anything unknown falls back to the dark face. */
export function normalizeSiteMode(
  mode: string | null | undefined,
): SiteThemeMode {
  return mode === "light" ? "light" : "dark";
}

/** Every token the design may set — cleared before it is applied. */
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
  /** Both faces of this design: the bright one and the deep one. */
  tokens: Record<"light" | "dark", Record<string, string>>;
};

/**
 * The design is described by its hue and how strongly it is chroma-saturated,
 * never by twenty hand-picked colours.
 *
 * At chroma 0 nothing tints the greys, so the deep page really is black and the
 * writing really is white. The action colour is the same tone one step away
 * from the page, which keeps every button readable in both modes.
 */
type VividSpec = {
  /** Base hue of the surfaces and writing. 0 = no hue at all. */
  hue: number;
  /** Chroma of the surfaces — how much colour the whole page carries. */
  chroma: number;
  /** Hue + chroma of the action colour (buttons). */
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
      "--muted-foreground": `oklch(0.38 ${(c * 0.55).toFixed(4)} ${s.hue})`,
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

/**
 * The store's only design: black and white, with nothing mixed into the greys.
 * The dashboard still offers it as a card so the identity stays visible and
 * documented, and the light / normal / dark switch chooses how it is worn.
 */
export const SITE_THEMES: SiteThemePreset[] = [
  {
    id: "original",
    nameAr: "أبيض وأسود",
    nameEn: "Black & White",
    blurbAr: "تصميم المتجر الأصلي: أسود عميق وكتابة بيضاء، بلا أي لون مدمج.",
    blurbEn:
      "The store’s own look: deep black and white writing, with no colour mixed in.",
    tokens: {
      light: vividTokens(V(0, 0, 0, 0, 0, 0, "0.625rem"), "light"),
      dark: vividTokens(V(0, 0, 0, 0, 0, 0, "0.625rem"), "dark"),
    },
  },
];

/** Falls back to the original look for unknown/blank ids. */
export function siteThemeById(id: string | null | undefined): SiteThemePreset {
  const wanted = (id ?? "").trim();
  return SITE_THEMES.find((preset) => preset.id === wanted) ?? SITE_THEMES[0]!;
}

/**
 * Writes the design onto `<html>`: previous tokens are removed first, so the
 * built-in stylesheet really is restored. Also mirrors the choice into
 * localStorage for the next page load.
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

/** The light / dark mode this browser saw last time, if any. */
export function readStoredSiteMode(): SiteThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SITE_THEME_MODE_STORAGE_KEY);
    return raw === null ? null : normalizeSiteMode(raw);
  } catch {
    return null;
  }
}
