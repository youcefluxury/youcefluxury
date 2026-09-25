import type { Lang } from "@/lib/i18n";

/**
 * Shared storefront data for HA Drip Boys.
 * Each record keeps both languages side by side; the UI renders only the
 * active one (see `src/lib/i18n.tsx`).
 */

export const STORE = {
  name: "HA Drip Boys",
  tagline: "Man's Fashion · Boutique Boys",
  phone: "0776105085",
  /** Surrounded by LTR marks (U+200E) so digit groups never flip in RTL. */
  phoneDisplay: "\u200E0776 10 50 85\u200E",
  whatsapp: "213776105085",
  instagram: "https://www.instagram.com/ha_drip14",
  facebook: "https://facebook.com/hadripboys",
  wilayaCount: 69,
  /** Flat delivery fee shown in the cart and stored on every order. */
  deliveryFee: 900,
  /** Google Maps embed of the shop — change this single URL to move the pin. */
  mapEmbedUrl:
    "https://maps.google.com/maps?q=35.180678,1.493835&z=15&output=embed",
} as const;

/* ------------------------------------------------------------------ */
/* 58 Algerian wilayas                                                 */
/* ------------------------------------------------------------------ */

export type Wilaya = { code: number; ar: string; fr: string };

export const WILAYAS: Wilaya[] = [
  { code: 1, ar: "أدرار", fr: "Adrar" },
  { code: 2, ar: "الشلف", fr: "Chlef" },
  { code: 3, ar: "الأغواط", fr: "Laghouat" },
  { code: 4, ar: "أم البواقي", fr: "Oum El Bouaghi" },
  { code: 5, ar: "باتنة", fr: "Batna" },
  { code: 6, ar: "بجاية", fr: "Béjaïa" },
  { code: 7, ar: "بسكرة", fr: "Biskra" },
  { code: 8, ar: "بشار", fr: "Béchar" },
  { code: 9, ar: "البليدة", fr: "Blida" },
  { code: 10, ar: "البويرة", fr: "Bouira" },
  { code: 11, ar: "تمنراست", fr: "Tamanrasset" },
  { code: 12, ar: "تبسة", fr: "Tébessa" },
  { code: 13, ar: "تلمسان", fr: "Tlemcen" },
  { code: 14, ar: "تيارت", fr: "Tiaret" },
  { code: 15, ar: "تيزي وزو", fr: "Tizi Ouzou" },
  { code: 16, ar: "الجزائر", fr: "Alger" },
  { code: 17, ar: "الجلفة", fr: "Djelfa" },
  { code: 18, ar: "جيجل", fr: "Jijel" },
  { code: 19, ar: "سطيف", fr: "Sétif" },
  { code: 20, ar: "سعيدة", fr: "Saïda" },
  { code: 21, ar: "سكيكدة", fr: "Skikda" },
  { code: 22, ar: "سيدي بلعباس", fr: "Sidi Bel Abbès" },
  { code: 23, ar: "عنابة", fr: "Annaba" },
  { code: 24, ar: "قالمة", fr: "Guelma" },
  { code: 25, ar: "قسنطينة", fr: "Constantine" },
  { code: 26, ar: "المدية", fr: "Médéa" },
  { code: 27, ar: "مستغانم", fr: "Mostaganem" },
  { code: 28, ar: "المسيلة", fr: "M'Sila" },
  { code: 29, ar: "معسكر", fr: "Mascara" },
  { code: 30, ar: "ورقلة", fr: "Ouargla" },
  { code: 31, ar: "وهران", fr: "Oran" },
  { code: 32, ar: "البيض", fr: "El Bayadh" },
  { code: 33, ar: "إليزي", fr: "Illizi" },
  { code: 34, ar: "برج بوعريريج", fr: "Bordj Bou Arréridj" },
  { code: 35, ar: "بومرداس", fr: "Boumerdès" },
  { code: 36, ar: "الطارف", fr: "El Tarf" },
  { code: 37, ar: "تندوف", fr: "Tindouf" },
  { code: 38, ar: "تيسمسيلت", fr: "Tissemsilt" },
  { code: 39, ar: "الوادي", fr: "El Oued" },
  { code: 40, ar: "خنشلة", fr: "Khenchela" },
  { code: 41, ar: "سوق أهراس", fr: "Souk Ahras" },
  { code: 42, ar: "تيبازة", fr: "Tipaza" },
  { code: 43, ar: "ميلة", fr: "Mila" },
  { code: 44, ar: "عين الدفلى", fr: "Aïn Defla" },
  { code: 45, ar: "النعامة", fr: "Naâma" },
  { code: 46, ar: "عين تموشنت", fr: "Aïn Témouchent" },
  { code: 47, ar: "غرداية", fr: "Ghardaïa" },
  { code: 48, ar: "غليزان", fr: "Relizane" },
  { code: 49, ar: "المغير", fr: "El M'Ghair" },
  { code: 50, ar: "المنيعة", fr: "El Meniaa" },
  { code: 51, ar: "أولاد جلال", fr: "Ouled Djellal" },
  { code: 52, ar: "برج باجي مختار", fr: "Bordj Baji Mokhtar" },
  { code: 53, ar: "بني عباس", fr: "Béni Abbès" },
  { code: 54, ar: "تيميمون", fr: "Timimoun" },
  { code: 55, ar: "تقرت", fr: "Touggourt" },
  { code: 56, ar: "جانت", fr: "Djanet" },
  { code: 57, ar: "عين صالح", fr: "In Salah" },
  { code: 58, ar: "عين قزام", fr: "In Guezzam" },
  { code: 59, ar: "أفلو", fr: "Aflou" },
  { code: 60, ar: "بريكة", fr: "Barika" },
  { code: 61, ar: "القنطرة", fr: "El Kantara" },
  { code: 62, ar: "بئر العاتر", fr: "Bir El Ater" },
  { code: 63, ar: "العريشة", fr: "El Aricha" },
  { code: 64, ar: "قصر الشلالة", fr: "Ksar Chellala" },
  { code: 65, ar: "عين وسارة", fr: "Aïn Ouessara" },
  { code: 66, ar: "مسعد", fr: "Messaad" },
  { code: 67, ar: "قصر البخاري", fr: "Ksar El Boukhari" },
  { code: 68, ar: "بوسعادة", fr: "Bou Saâda" },
  { code: 69, ar: "الأبيض سيدي الشيخ", fr: "El Abiodh Sidi Cheikh" },
];

/** "16 — الجزائر" / "16 — Alger" depending on the active language. */
export function wilayaLabel(wilaya: Wilaya, lang: Lang): string {
  const name = lang === "ar" ? wilaya.ar : wilaya.fr;
  return `${String(wilaya.code).padStart(2, "0")} — ${name}`;
}

/** Localized wilaya name, straight from the selected language. */
export function wilayaName(
  code: number,
  lang: Lang,
  fallbackAr: string,
  fallbackFr: string,
): string {
  const match = WILAYAS.find((wilaya) => wilaya.code === code);
  if (match) return lang === "ar" ? match.ar : match.fr;
  return lang === "ar" ? fallbackAr : fallbackFr;
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export type Category = {
  slug: string;
  ar: string;
  en: string;
  image: string;
  sizes: string[];
  hasSizeGuide: boolean;
};

export const CATEGORIES: Category[] = [
  {
    slug: "tshirts",
    ar: "تي شيرت أوفرسايز وهودي",
    en: "Oversize T-shirts & Hoodies",
    image: "/products/cat-tshirts.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    hasSizeGuide: false,
  },
  {
    slug: "pants",
    ar: "سراويل واسعة",
    en: "Baggy & Boyfriend Pants",
    image: "/products/cat-pants.jpg",
    sizes: ["29", "30", "31", "32", "33", "34", "35", "36"],
    hasSizeGuide: true,
  },
  {
    slug: "sets",
    ar: "أطقم كاملة",
    en: "Full Sets",
    image: "/products/cat-sets.jpg",
    sizes: ["S", "M", "L", "XL"],
    hasSizeGuide: false,
  },
  {
    slug: "shoes",
    ar: "أحذية",
    en: "Shoes",
    image: "/products/cat-shoes.jpg",
    sizes: ["40", "41", "42", "43", "44", "45"],
    hasSizeGuide: false,
  },
  {
    slug: "accessories",
    ar: "كاب وإكسسوارات",
    en: "Caps & Accessories",
    image: "/products/cat-accessories.jpg",
    sizes: ["ONE SIZE"],
    hasSizeGuide: false,
  },
];

export function categoryBySlug(slug: string | undefined): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}

/** Either the static shape (ar/en) or a database row (nameAr/nameEn). */
type CategoryNameSource =
  | Pick<Category, "ar" | "en">
  | Pick<DbCategory, "nameAr" | "nameEn">;

export function categoryName(category: CategoryNameSource, lang: Lang): string {
  const ar = "ar" in category ? category.ar : category.nameAr;
  const en = "en" in category ? category.en : category.nameEn;
  return lang === "ar" ? ar || en : en || ar;
}

export function categoryLabel(slug: string, lang: Lang): string {
  const category = categoryBySlug(slug);
  return category ? categoryName(category, lang) : slug;
}

/* ------------------------------------------------------------------ */
/* Live categories — admin-managed rows from the database. The         */
/* storefront always mirrors the dashboard: what the admin sees is    */
/* what shoppers see, even when the list is empty.                    */
/* ------------------------------------------------------------------ */

export type DbCategory = {
  _id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string;
  sizes: string[];
  hasSizeGuide: boolean;
};

/**
 * Categories actually shown by the storefront. `undefined` (still loading)
 * is distinct from `[]` (admin deleted them all) so pages can show a quiet
 * loading state instead of a fake list.
 */
export function liveCategories(rows: DbCategory[] | undefined): Category[] {
  if (!rows) return [];
  return rows.map((row) => ({
    slug: row.slug,
    ar: row.nameAr || row.nameEn,
    en: row.nameEn || row.nameAr,
    image: row.image,
    sizes: row.sizes,
    hasSizeGuide: row.hasSizeGuide,
  }));
}

/** Same lookup against an admin-managed category list. */
export function liveCategoryBySlug(
  rows: DbCategory[] | undefined,
  slug: string | undefined,
): Category | undefined {
  if (slug === undefined || !rows) return undefined;
  const list = liveCategories(rows);
  return list.find((category) => category.slug === slug);
}

export function liveCategoryLabel(
  rows: DbCategory[] | undefined,
  slug: string | undefined,
  lang: Lang,
): string {
  const found = rows?.find((row) => row.slug === slug);
  if (found) return lang === "ar" ? found.nameAr || found.nameEn : found.nameEn || found.nameAr;
  return slug ? categoryLabel(slug, lang) : slug ?? "";
}

/* ------------------------------------------------------------------ */
/* Colours & sizes (stored as keys, shown in the active language)      */
/* ------------------------------------------------------------------ */

type ColorName = { keys: string[]; ar: string; en: string };

const COLOR_NAMES: ColorName[] = [
  { keys: ["black", "أسود", "noir"], ar: "أسود", en: "Black" },
  { keys: ["white", "أبيض", "blanc"], ar: "أبيض", en: "White" },
  { keys: ["grey", "gray", "رمادي", "gris"], ar: "رمادي", en: "Grey" },
  { keys: ["navy", "كحلي", "marine"], ar: "كحلي", en: "Navy" },
  { keys: ["beige", "بيج"], ar: "بيج", en: "Beige" },
  { keys: ["denim", "دنيم"], ar: "أزرق دنيم", en: "Denim blue" },
  { keys: ["brown", "بني", "marron"], ar: "بني", en: "Brown" },
  { keys: ["green", "أخضر", "vert"], ar: "أخضر", en: "Green" },
  { keys: ["red", "أحمر", "rouge"], ar: "أحمر", en: "Red" },
  { keys: ["blue", "أزرق", "bleu"], ar: "أزرق", en: "Blue" },
  { keys: ["yellow", "أصفر", "jaune"], ar: "أصفر", en: "Yellow" },
  { keys: ["orange", "برتقالي"], ar: "برتقالي", en: "Orange" },
  { keys: ["purple", "بنفسجي", "violet"], ar: "بنفسجي", en: "Purple" },
  { keys: ["pink", "وردي", "rose"], ar: "وردي", en: "Pink" },
  { keys: ["khaki", "كاكي"], ar: "كاكي", en: "Khaki" },
  { keys: ["olive", "زيتي"], ar: "زيتي", en: "Olive" },
  { keys: ["cream", "كريمي"], ar: "كريمي", en: "Cream" },
  { keys: ["camel", "جملي"], ar: "جملي", en: "Camel" },
];

/** Swatch colours shown in the admin picker and the storefront dots. */
export const COLOR_SWATCHES: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  grey: "#8a8a8a",
  navy: "#1f2a44",
  beige: "#d9cbb2",
  denim: "#3b5f8a",
  brown: "#6b4a2f",
  green: "#3c6b47",
  red: "#b03030",
  blue: "#2f5fa8",
  yellow: "#d9b526",
  orange: "#d97a2b",
  purple: "#6b4a8a",
  pink: "#d98aa6",
  khaki: "#b3a274",
  olive: "#7a7a44",
  cream: "#f1e7d3",
  camel: "#c19a6b",
  unknown: "linear-gradient(135deg,#e5e5e5 45%,#9a9a9a 55%)",
};

/** The canonical key list the admin picks from. */
export const COLOR_KEYS = COLOR_NAMES.map((color) => color.keys[0]);

export const UNKNOWN_COLOR = "unknown";

export function colorSwatch(key: string): string {
  return COLOR_SWATCHES[key] ?? COLOR_SWATCHES.unknown;
}

export function isKnownColor(key: string): boolean {
  return key in COLOR_SWATCHES && key !== UNKNOWN_COLOR;
}

/**
 * Accepts colour keys ("black"), the "unknown" placeholder and legacy free
 * text ("أسود / Noir"), so older records keep rendering in one language.
 */
export function colorLabel(value: string, lang: Lang): string {
  if (!value || value === UNKNOWN_COLOR || value === "—") {
    return lang === "ar" ? "غير معروف" : "Unknown";
  }
  const normalized = value.toLowerCase();
  const match = COLOR_NAMES.find((color) =>
    color.keys.some((key) => normalized.includes(key.toLowerCase())),
  );
  return match ? match[lang] : value;
}

/** "مقاس واحد / Taille unique" → "مقاس واحد" | "One size". */
export function sizeLabel(value: string, lang: Lang): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("unique") || value.includes("مقاس واحد")) {
    return lang === "ar" ? "مقاس واحد" : "One size";
  }
  return value;
}

/**
 * How long a card marked “sold out” stays on the storefront: for exactly
 * 24 hours it shows the red “نفذت الكمية” tag, then it disappears by itself.
 */
export const SOLD_OUT_VISIBLE_MS = 24 * 60 * 60 * 1000;

/**
 * True once a sold-out product has passed its 24-hour window. Such products
 * leave the storefront (home, shop, category, related) while the dashboard
 * keeps listing them so the admin can restock or edit them.
 */
export function isHiddenFromStore(
  product: { soldOut?: boolean; soldOutAt?: number },
  now: number = Date.now(),
): boolean {
  if (!product.soldOut || !product.soldOutAt) return false;
  return now - product.soldOutAt >= SOLD_OUT_VISIBLE_MS;
}

/** Order status code ("new") or legacy label → localized sentence. */
export function orderStatusLabel(value: string, lang: Lang): string {
  const normalized = value.toLowerCase();
  const status = ORDER_STATUSES.find((entry) => entry.code === normalized);
  if (status) {
    return lang === "ar" ? status.ar : status.en;
  }
  const isNew =
    normalized === "new" ||
    value.includes("جديد") ||
    normalized.includes("nouveau");
  if (isNew) {
    return lang === "ar" ? "طلب جديد" : "New order";
  }
  return value;
}

/** Workflow states an admin can move an order through. */
export const ORDER_STATUSES = [
  { code: "new", ar: "طلب جديد", en: "New" },
  { code: "confirmed", ar: "تم التأكيد", en: "Confirmed" },
  { code: "shipped", ar: "قيد التوصيل", en: "Shipped" },
  { code: "delivered", ar: "تم التسليم", en: "Delivered" },
  { code: "cancelled", ar: "ملغى", en: "Cancelled" },
] as const;

export type OrderStatusCode = (typeof ORDER_STATUSES)[number]["code"];

/** Convex error codes → localized checkout messages. */
export function orderErrorMessage(code: string, lang: Lang): string {
  const messages: Record<string, { ar: string; en: string }> = {
    INVALID_NAME: { ar: "الاسم غير مكتمل", en: "The name is incomplete" },
    INVALID_PHONE: { ar: "رقم الهاتف غير صحيح", en: "The phone number is invalid" },
    INVALID_ADDRESS: { ar: "العنوان مطلوب", en: "An address is required" },
    EMPTY_CART: { ar: "السلة فارغة", en: "Your bag is empty" },
  };
  const entry = messages[code.trim().toUpperCase()];
  return entry ? entry[lang] : "";
}

/** Payment method code ("cod") or legacy label → localized sentence. */
export function paymentLabel(value: string, lang: Lang): string {
  const normalized = value.toLowerCase();
  const isCod =
    normalized.includes("cod") ||
    value.includes("استلام") ||
    normalized.includes("livraison");
  if (isCod) {
    return lang === "ar" ? "الدفع عند الاستلام" : "Cash on delivery";
  }
  return value;
}

/* ------------------------------------------------------------------ */
/* Sizing guide (Mesures en cm) — sizes 29 → 36                        */
/* ------------------------------------------------------------------ */

export type SizeGuideRow = { size: string; waist: number; length: number };

export const SIZE_GUIDE: SizeGuideRow[] = [
  { size: "29", waist: 72, length: 98 },
  { size: "30", waist: 75, length: 99 },
  { size: "31", waist: 78, length: 100 },
  { size: "32", waist: 81, length: 101 },
  { size: "33", waist: 84, length: 102 },
  { size: "34", waist: 87, length: 103 },
  { size: "35", waist: 90, length: 104 },
  { size: "36", waist: 93, length: 105 },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** 4500 → "4 500 DA" (Algerian dinar, western digits for both languages). */
export function formatDA(amount: number): string {
  const value = Math.round(amount);
  const digits = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
  // LTR marks keep digit groups from flipping inside Arabic text; دج reads right-to-left.
  return `\u200E${digits} دج`;
}

export function isNumericSize(size: string): boolean {
  return /^\d+$/.test(size.trim());
}

/** Digits only — the shape the dashboard stores in the database. */
export function phoneDigits(value: string = STORE.phone): string {
  return value.replace(/\D+/g, "");
}

/** 0776105085 → "‎0776 10 50 85‎" (LTR marks keep it tidy inside RTL text). */
export function phoneDisplay(value: string = STORE.phone): string {
  const digits = phoneDigits(value);
  const grouped = digits.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  return `\u200E${grouped}\u200E`;
}

/** 0776105085 → "213776105085" — the international form wa.me expects. */
export function whatsappNumber(value: string = STORE.phone): string {
  const digits = phoneDigits(value).replace(/^0+/, "");
  return digits.startsWith("213") ? digits : `213${digits}`;
}

/** `phone` (optional) lets the admin-saved number override the default. */
export function whatsappLink(message?: string, phone?: string): string {
  const base = `https://wa.me/${whatsappNumber(phone ?? STORE.phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Instagram DM deep link to the shop's chat, with the order text pre-filled.
 * ig.me opens the Instagram app directly in the merchant conversation; the
 * customer only has to press Send (Instagram blocks fully-automatic sends).
 * `profile` (optional) lets the admin-saved Instagram link override the default
 * account, so the order always lands in the right chat.
 */
export function instagramOrderLink(message: string, profile?: string): string {
  const source = profile?.trim() ? profile : STORE.instagram;
  const username = source.split("/").filter(Boolean).pop() ?? "ha_drip14";
  return `https://ig.me/m/${username}?text=${encodeURIComponent(message)}`;
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

/**
 * Folds text so a search always finds what it should, whatever the keyboard:
 *
 * - Arabic diacritics (tashkeel) and the tatweel stretch are dropped.
 * - Alef / yeh / teh-marbuta / hamza variants unify, so «أوفرسايز»، «اوفرسايز»
 *   and the Persian-keyboard «اوفرسایز» all become the same letters.
 * - Latin accents are stripped (Café → cafe) and everything is lower-cased.
 * - Arabic-Indic digits become plain 0-9, so «٣» finds «3» too.
 */
export function normalizeSearch(value: string): string {
  return (
    value
      .toLowerCase()
      // NFKD splits accents off the base letter; the next line removes them.
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      // Arabic tashkeel, hamza marks (NFKD splits أ into ا + hamza) and
      // Quranic marks — all removed, so «أوفر» folds to «اوفر».
      .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
      .replace(/\u0640/g, "")
      .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // آ أ إ ٱ → ا
      .replace(/\u0629/g, "\u0647") // ة → ه
      .replace(/\u0649/g, "\u064a") // ى → ي
      .replace(/\u06cc/g, "\u064a") // Persian yeh → ي
      .replace(/\u0624/g, "\u0648") // ؤ → و
      .replace(/\u0626/g, "\u064a") // ئ → ي
      .replace(/\u06a9/g, "\u0643") // Persian kaf → ك
      .replace(/[\u0660-\u0669]/g, (digit) =>
        String(digit.charCodeAt(0) - 0x0660),
      )
      .replace(/[\u06f0-\u06f9]/g, (digit) =>
        String(digit.charCodeAt(0) - 0x06f0),
      )
      // Punctuation and dashes act as spaces, so “t-shirt” also finds “tshirt”.
      .replace(/[\u061f\u060c.,/\\|_+*'"`!?()[\]{}:;<>~#%@&\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Forgiving search used by the shop: every word typed just has to appear
 * somewhere in the text — even half a word, in Arabic or in English, in any
 * order. “اوفر” finds «تي شيرت أوفرسايز / T-Shirt Oversize».
 */
export function matchesSearch(haystack: string, query: string): boolean {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const text = normalizeSearch(haystack);
  return words.every((word) => text.includes(word));
}
