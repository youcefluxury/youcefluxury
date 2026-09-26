/**
 * The store's site design, and the one way it is worn.
 *
 * The design is a list of CSS custom properties written straight onto
 * `<html>`, so the whole storefront — header, footer, buttons, cards, corner
 * radius — restyles at once without touching any product or order. It is saved
 * in the database *and* mirrored into localStorage, so the first paint after a
 * reload already wears it.
 *
 * There is exactly one design and exactly one face: a white page with black
 * writing, on black bands. No second mode, no tinted greys, no accent colour —
 * every token below is either `#000000` or `#ffffff`, or black at a low alpha
 * when a surface needs to be lifted off the page without introducing a hue.
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
 * The store's only design, written out as plain black and white.
 *
 * These tokens were once computed as near-black / near-white greys
 * (oklch(0.2) and oklch(0.975)). Those are only *almost* black, and on a
 * monochrome design that reads as grey: nav links and the black action buttons
 * looked washed out against the page. Everything is now a true `#000000` or a
 * true `#ffffff`.
 *
 * A surface that has to lift off the page — a hover fill, a quiet panel —
 * uses black at a low alpha instead of a grey colour. It still reads as one
 * flat colour, and the writing on top of it stays pure black.
 */
function blackWhiteTokens(): Record<string, string> {
  return {
    /* Pure white page. */
    "--background": "#ffffff",
    "--card": "#ffffff",
    "--popover": "#ffffff",
    /* Pure black writing. */
    "--foreground": "#000000",
    "--card-foreground": "#000000",
    "--popover-foreground": "#000000",
    /* A true black button, with white writing on it. */
    "--primary": "#000000",
    "--primary-foreground": "#ffffff",
    /* Quiet fills: black washed onto the white page, never a grey of their own. */
    "--secondary": "rgba(0, 0, 0, 0.05)",
    "--secondary-foreground": "#000000",
    "--muted": "rgba(0, 0, 0, 0.05)",
    "--muted-foreground": "#000000",
    "--accent": "rgba(0, 0, 0, 0.08)",
    "--accent-foreground": "#000000",
    /* Nothing is a second colour here, not even the destructive tone. */
    "--destructive": "#000000",
    /* Hairlines read as a soft shade, never a hard line. */
    "--border": "rgba(0, 0, 0, 0.16)",
    "--input": "rgba(0, 0, 0, 0.16)",
    "--ring": "#000000",
    /* The inverted band pair, used by .on-ink and by the design swatches. */
    "--ink": "#000000",
    "--paper": "#ffffff",
    /* The signature accent is the same true black as the action colour. */
    "--brand": "#000000",
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
