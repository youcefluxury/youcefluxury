import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { STORE } from "@/lib/store-data";

/**
 * Live store identity the admin can change from the site itself: the logo
 * photo plus the Instagram and Facebook profiles. Empty values fall back to
 * the built-ins.
 */
export function useStoreBrand(): {
  logo: string;
  instagram: string;
  facebook: string;
} {
  const settings = useQuery(api.catalog.getStoreSettings);
  const logo = settings?.logo?.trim() ?? "";
  const instagram = settings?.instagram?.trim() ?? "";
  const facebook = settings?.facebook?.trim() ?? "";

  return {
    logo: logo.length > 0 ? logo : "/brand.svg",
    instagram: instagram.length > 0 ? instagram : STORE.instagram,
    facebook: facebook.length > 0 ? facebook : STORE.facebook,
  };
}
