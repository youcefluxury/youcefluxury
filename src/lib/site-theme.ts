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
 * The store's one design, written out as plain black and white.
 *
 * Earlier these tokens were computed as near-black / near-white greys
 * (oklch(0.2) and oklch(0.975)). Those are only *almost* black, and on a
 * monochrome design that reads as grey: nav links and the black action
 * buttons looked washed out against the page. The design is exactly two
 * values now — #000000 and #ffffff — and every quiet tone is a real grey
 * that is meant to look grey, so the contrast between "the writing" and
 * "the supporting copy" stays obvious.
 */
function blackWhiteTokens(mode: SiteThemeMode): Record<string, string> {
  if (mode === "light") {
    return {
      /* Pure white page, pure black writing. */
      "--background": "#ffffff",
      "--card": "#ffffff",
      "--popover": "#ffffff",
      "--foreground": "#000000",
      "--card-foreground": "#000000",
      "--popover-foreground": "#000000",
      /* A true black button, with white writing on it. */
      "--primary": "#000000",
      "--primary-foreground": "#ffffff",
      /* Quiet fills stay clearly grey so the black above still leads. */
      "--secondary": "#f2f2f2",
      "--secondary-foreground": "#000000",
      "--muted": "#f2f2f2",
      "--muted-foreground": "#4d4d4d",
      "--accent": "#ebebeb",
      "--accent-foreground": "#000000",
      /* Hairlines read as a soft shade, never a hard line. */
      "--border": "rgba(0, 0, 0, 0.14)",
      "--input": "rgba(0, 0, 0, 0.12)",
      "--ring": "#000000",
      /* The inverted band pair, identical in both faces. */
      "--ink": "#000000",
      "--paper": "#ffffff",
      /* The signature accent is the same true black as the action colour. */
      "--brand": "#000000",
      "--radius": "0.625rem",
    };
  }

  return {
    /* Pure black page, pure white writing. */
    "--background": "#000000",
    "--card": "#0b0b0b",
    "--popover": "#0b0b0b",
    "--foreground": "#ffffff",
    "--card-foreground": "#ffffff",
    "--popover-foreground": "#ffffff",
    /* A true white button, with black writing on it. */
    "--primary": "#ffffff",
    "--primary-foreground": "#000000",
    /* Quiet fills read clearly above the black page. */
    "--secondary": "#1a1a1a",
    "--secondary-foreground": "#ffffff",
    "--muted": "#1a1a1a",
    "--muted-foreground": "#a6a6a6",
    "--accent": "#262626",
    "--accent-foreground": "#ffffff",
    /* Hairlines stay a soft lift, never a hard line. */
    "--border": "rgba(255, 255, 255, 0.18)",
    "--input": "rgba(255, 255, 255, 0.2)",
    "--ring": "#ffffff",
    /* The inverted band pair, identical in both faces. */
    "--ink": "#000000",
    "--paper": "#ffffff",
    /* The signature accent is the same true white as the action colour. */
    "--brand": "#ffffff",
    "--radius": "0.625rem",
  };
}

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
      light: blackWhiteTokens("light"),
      dark: blackWhiteTokens("dark"),
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
