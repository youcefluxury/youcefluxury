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

  return {
    logo: logo.length > 0 ? logo : "/brand.svg",
    name: name.length > 0 ? name : STORE.name,
    tagline: tagline.length > 0 ? tagline : STORE.tagline,
    description: description.length > 0 ? description : STORE.description,
    instagram: instagram.length > 0 ? instagram : STORE.instagram,
    facebook: facebook.length > 0 ? facebook : STORE.facebook,
    mapEmbedUrl: map.length > 0 ? map : STORE.mapEmbedUrl,
  };
}
