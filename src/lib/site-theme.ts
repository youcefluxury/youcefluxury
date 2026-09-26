/**
 * The store's site design, and the one way it is worn.
 *
 * The design is a list of CSS custom properties written straight onto
 * `<html>`, so the whole storefront — header, footer, buttons, cards, corner
 * radius — restyles at once without touching any product or order. It is saved
 * in the database *and* mirrored into localStorage, so the first paint after a
 * reload already wears it.
 *
 * There is exactly one design and exactly one face: a white page with near
 * black writing, on the inverted `--ink` band.
 */

/** localStorage key shared with the instant-apply step in the provider. */
export const SITE_THEME_STORAGE_KEY = "store.site-theme";

/**
 * Kept only so a browser that still holds the retired switch can clear it.
 * The value itself is no longer read or written.
 */
const RETIRED_MODE_STORAGE_KEY = "store.site-mode";

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
  "--destructive",
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
  /** The whole palette for this design. */
  tokens: Record<string, string>;
};

/**
 * The store's only design, taken from the palette the live store renders with.
 *
 * A white page, near-black writing, a black action button, one muted gold for
 * the signature accent, and a red reserved for destructive actions. The greys
 * are deliberately separated steps of neutral, not tints of a hue, so the page
 * reads as a single black-and-white face from end to end.
 */
function blackWhiteTokens(): Record<string, string> {
  return {
    /* Bright, luminous surfaces: the page reads white, never grey. */
    "--background": "oklch(100% 0 0)",
    "--foreground": "oklch(14.5% 0 0)",
    "--card": "oklch(100% 0 0)",
    "--card-foreground": "oklch(14.5% 0 0)",
    "--popover": "oklch(100% 0 0)",
    "--popover-foreground": "oklch(14.5% 0 0)",
    /* The action colour is the deepest tone: a true black button. */
    "--primary": "oklch(20.5% 0 0)",
    "--primary-foreground": "oklch(98.5% 0 0)",
    "--secondary": "oklch(97% 0 0)",
    "--secondary-foreground": "oklch(20.5% 0 0)",
    "--muted": "oklch(97% 0 0)",
    "--muted-foreground": "oklch(55.6% 0 0)",
    "--accent": "oklch(97% 0 0)",
    "--accent-foreground": "oklch(20.5% 0 0)",
    "--destructive": "oklch(57.7% 0.245 27.325)",
    /* Hairlines read as a soft shade, never a hard line. */
    "--border": "oklch(92.2% 0 0)",
    "--input": "oklch(92.2% 0 0)",
    "--ring": "oklch(70.8% 0 0)",
    /* The inverted band pair, used by .on-ink and by the design swatches. */
    "--ink": "#0a0a0a",
    "--paper": "#fafafa",
    /* The signature accent: a single muted gold. */
    "--brand": "#b08d57",
    "--radius": "0.625rem",
  };
}

/**
 * The store's only design: black and white, with nothing mixed into it.
 * The dashboard still offers it as a card so the identity stays visible and
 * documented.
 */
export const SITE_THEMES: SiteThemePreset[] = [
  {
    id: "original",
    nameAr: "أبيض وأسود",
    nameEn: "Black & White",
    blurbAr: "تصميم المتجر الأصلي: صفحة بيضاء وكتابة سوداء، بلا أي لون مدمج.",
    blurbEn:
      "The store’s own look: a white page with black writing, with no colour mixed in.",
    tokens: blackWhiteTokens(),
  },
];

/** Falls back to the original look for unknown/blank ids. */
export function siteThemeById(id: string | null | undefined): SiteThemePreset {
  const wanted = (id ?? "").trim();
  return SITE_THEMES.find((preset) => preset.id === wanted) ?? SITE_THEMES[0]!;
}

/**
 * Writes the design onto `<html>`: previous tokens are removed first, so the
 * built-in stylesheet really is restored. Any leftover `dark` class and the
 * retired mode key are cleared too, so a browser that used to wear the deep
 * face comes back to the white page. Also mirrors the choice into localStorage
 * for the next page load.
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
  /* There is no deep face any more, so the class Tailwind listens to goes. */
  root.classList.remove("dark");
  root.style.colorScheme = "light";

  try {
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, preset.id);
    window.localStorage.removeItem(RETIRED_MODE_STORAGE_KEY);
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
