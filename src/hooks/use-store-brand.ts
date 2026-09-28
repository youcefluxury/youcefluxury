import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { STORE, toMapEmbedUrl } from "@/lib/store-data";

/**
 * Live store identity the admin can change from the site itself: the name,
 * tagline, site description, logo, the Instagram / Facebook profiles and the
 * shop's map location. Empty values fall back to the built-ins.
 */
export function useStoreBrand(): {
  logo: string;
  name: string;
  tagline: string;
  description: string;
  instagram: string;
  facebook: string;
  mapEmbedUrl: string;
  /** The paragraph under the brand in the footer. */
  footerAbout: string;
  /**
   * False until the settings query answers. Every field above is a built-in
   * placeholder while this is false, so anything that mirrors the identity
   * somewhere else — the favicon, `localStorage`, the loading screen in
   * index.html — must wait for it. Publishing the placeholder would overwrite
   * the saved identity and flash the wrong logo on the next page load.
   */
  settingsLoaded: boolean;
} {
  const settings = useQuery(api.catalog.getStoreSettings);
  const logo = settings?.logo?.trim() ?? "";
  const name = settings?.name?.trim() ?? "";
  const tagline = settings?.tagline?.trim() ?? "";
  const description = settings?.description?.trim() ?? "";
  const instagram = settings?.instagram?.trim() ?? "";
  const facebook = settings?.facebook?.trim() ?? "";
  // A saved map is normalised to an embed URL; anything unreadable is ignored.
  const map = toMapEmbedUrl(settings?.mapEmbedUrl ?? "");
  const footerAbout = settings?.footerAbout?.trim() ?? "";

  return {
    // The bundled store logo, so there is never a broken or empty frame.
    logo: logo.length > 0 ? logo : "/logo.png",
    name: name.length > 0 ? name : STORE.name,
    tagline: tagline.length > 0 ? tagline : STORE.tagline,
    description: description.length > 0 ? description : STORE.description,
    instagram: instagram.length > 0 ? instagram : STORE.instagram,
    facebook: facebook.length > 0 ? facebook : STORE.facebook,
    mapEmbedUrl: map.length > 0 ? map : STORE.mapEmbedUrl,
    footerAbout,
    settingsLoaded: settings !== undefined,
  };
}
