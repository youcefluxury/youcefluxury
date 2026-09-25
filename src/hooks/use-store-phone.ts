import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { STORE, phoneDisplay, phoneDigits, whatsappNumber } from "@/lib/store-data";

/**
 * The shop's phone number, editable by the admin from the storefront itself.
 * Falls back to the built-in default until a number is saved, and updates
 * everywhere at once (Convex queries are reactive).
 */
export function useStorePhone() {
  const saved = useQuery(api.catalog.getPhone);
  const digits = saved ? phoneDigits(saved) : "";
  const phone = digits.length >= 9 ? digits : STORE.phone;

  return {
    /** Raw digits, e.g. "0776105085". */
    phone,
    /** Spaced display value, e.g. "‎0776 10 50 85‎". */
    display: phoneDisplay(phone),
    /** International form for wa.me, e.g. "213776105085". */
    whatsapp: whatsappNumber(phone),
  };
}
