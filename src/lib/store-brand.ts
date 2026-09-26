/**
 * The live store name, tagline and logo, mirrored into localStorage.
 *
 * Two places need the identity *before* the database answers: the loading
 * screen in `index.html` (a plain script that runs before the bundle) and the
 * very first `document.title`. `StoreMeta` keeps this cache up to date, so
 * both show whatever the dashboard saved — never a hard-coded value.
 */

/** Shared with the boot screen script in index.html. */
export const BRAND_CACHE_KEY = "hadrip.brand";

export type CachedBrand = {
  name?: string;
  tagline?: string;
  logo?: string;
};

/** Mirrors the current identity for the loading screen and the tab title. */
export function cacheBrand(brand: {
  name: string;
  tagline: string;
  logo: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify(brand));
  } catch {
    /* private mode / storage full — the defaults simply stay in place */
  }
}

/** Whatever the last visit cached, if anything. */
export function readCachedBrand(): CachedBrand {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BRAND_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const record = parsed as Record<string, unknown>;
    return {
      name: typeof record.name === "string" ? record.name : undefined,
      tagline: typeof record.tagline === "string" ? record.tagline : undefined,
      logo: typeof record.logo === "string" ? record.logo : undefined,
    };
  } catch {
    return {};
  }
}
