import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isValidAdminKey } from "./admin";

const sizeValidator = v.object({
  label: v.string(),
  available: v.boolean(),
});

/** One colour's list of sold-out sizes (e.g. black → S, M). */
const colorSizesValidator = v.object({
  color: v.string(),
  sizes: v.array(v.string()),
});

/** Shape shared by the "create product" and "update product" mutations. */
const productFields = {
  nameAr: v.string(),
  nameEn: v.string(),
  price: v.number(),
  oldPrice: v.optional(v.number()),
  category: v.string(),
  images: v.array(v.string()),
  /**
   * One colour per photo, index-aligned with `images` ("" = no colour).
   * Optional so older callers keep working.
   */
  imageColors: v.optional(v.array(v.string())),
  /** Sizes sold out per photo, index-aligned with `images`. */
  imageSizes: v.optional(v.array(v.array(v.string()))),
  sizes: v.array(sizeValidator),
  colors: v.array(v.string()),
  /** Per-colour sold-out sizes — optional so old callers keep working. */
  soldOutByColor: v.optional(v.array(colorSizesValidator)),
  soldOut: v.boolean(),
  featured: v.boolean(),
  /** Delivery price for this product in DA — empty means the shop default. */
  deliveryFee: v.optional(v.number()),
  descriptionAr: v.string(),
  descriptionEn: v.string(),
};

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

/** Public catalogue feed used by the home page, the shop and the admin table. */
export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

export const getProduct = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // normalizeId keeps malformed URLs (e.g. /product/xyz) from crashing.
    const productId = ctx.db.normalizeId("products", args.id);
    if (!productId) {
      return null;
    }
    return await ctx.db.get(productId);
  },
});

/**
 * Photos plus their colours, cleaned together so the two lists stay aligned:
 * blanks and duplicates go, and every kept photo carries exactly one colour
 * (the admin picks a single colour per photo).
 */
function cleanPhotos(
  images: string[],
  colors: string[] = [],
  sizes: string[][] = [],
) {
  const urls: string[] = [];
  const swatches: string[] = [];
  const rows: string[][] = [];
  images.forEach((raw, index) => {
    const url = raw.trim();
    if (!url || urls.includes(url)) return;
    urls.push(url);
    swatches.push((colors[index] ?? "").trim());
    // Every photo carries its own sold-out sizes, never another photo's.
    rows.push(
      [...new Set((sizes[index] ?? []).map((size) => size.trim()))].filter(
        Boolean,
      ),
    );
  });
  return { images: urls, imageColors: swatches, imageSizes: rows };
}

/** Previous per-photo values, keyed by photo URL, for edit-in-place safety. */
function photoValuesByUrl(
  images: string[] | undefined,
  colors: string[] | undefined,
  sizes: string[][] | undefined,
) {
  const colorsByUrl = new Map<string, string>();
  const sizesByUrl = new Map<string, string[]>();
  (images ?? []).forEach((url, index) => {
    colorsByUrl.set(url, (colors ?? [])[index] ?? "");
    sizesByUrl.set(url, (sizes ?? [])[index] ?? []);
  });
  return { colorsByUrl, sizesByUrl };
}

function buildSizes(labels: string[], soldOut: string[]) {
  return labels
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ label, available: !soldOut.includes(label) }));
}

export const createProduct = mutation({
  args: { adminKey: v.string(), ...productFields },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    if (!args.nameAr.trim() || !args.nameEn.trim() || args.price <= 0) {
      throw new Error("INVALID_PRODUCT");
    }
    const { adminKey: _adminKey, ...product } = args;
    const photos = cleanPhotos(
      product.images,
      product.imageColors ?? [],
      product.imageSizes ?? [],
    );
    return await ctx.db.insert("products", {
      ...product,
      // A product created already sold out starts its 24-hour countdown now.
      soldOutAt: product.soldOut ? Date.now() : undefined,
      // Empty string / 0 from the form → no product-specific fee.
      deliveryFee: product.deliveryFee && product.deliveryFee > 0 ? product.deliveryFee : undefined,
      ...photos,
      // Drop empty rows and unknown colours so the storefront stays clean.
      soldOutByColor: (product.soldOutByColor ?? []).filter(
        (row) => row.color.trim() && row.sizes.length > 0,
      ),
      createdAt: Date.now(),
    });
  },
});

export const updateProduct = mutation({
  args: { adminKey: v.string(), id: v.id("products"), ...productFields },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const { adminKey: _adminKey, id, ...product } = args;
    const existing = await ctx.db.get(id);
    /*
     * The 24-hour countdown starts the moment the product is switched to
     * "sold out" and is cleared when it becomes available again. Editing an
     * already sold-out product never restarts the clock.
     */
    const soldOutAt = !product.soldOut
      ? undefined
      : existing?.soldOut && existing.soldOutAt
        ? existing.soldOutAt
        : Date.now();
    /*
     * Editing a product from the full form rewrites its photos: every photo
     * that was already there keeps the colour it had (matched by URL), and
     * newly added photos use the colours sent by the form, if any.
     */
    const previous = photoValuesByUrl(
      existing?.images,
      existing?.imageColors,
      existing?.imageSizes,
    );
    const photos = cleanPhotos(
      product.images,
      product.images.map(
        (url, index) =>
          product.imageColors?.[index] ?? previous.colorsByUrl.get(url) ?? "",
      ),
      product.images.map(
        (url, index) =>
          product.imageSizes?.[index] ?? previous.sizesByUrl.get(url) ?? [],
      ),
    );
    await ctx.db.patch(id, {
      ...product,
      soldOutAt,
      deliveryFee: product.deliveryFee && product.deliveryFee > 0 ? product.deliveryFee : undefined,
      ...photos,
      soldOutByColor: (product.soldOutByColor ?? []).filter(
        (row) => row.color.trim() && row.sizes.length > 0,
      ),
    });
    return id;
  },
});

export const deleteProduct = mutation({
  args: { adminKey: v.string(), id: v.id("products") },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Photo manager behind the admin's “＋” on the product page. It writes the
 * whole list, so the same call both adds a photo and removes one — without
 * touching any other field of the product. Blanks are dropped, duplicates are
 * collapsed and the first entry stays the card cover.
 */
export const setProductImages = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("products"),
    images: v.array(v.string()),
    /** One colour per photo, index-aligned with `images` ("" = no colour). */
    imageColors: v.optional(v.array(v.string())),
    /**
     * Sizes sold out for each photo, index-aligned with `images` — every photo
     * keeps its own list. Omitted → the lists the photos already had are kept
     * (matched by URL), so editing photos never wipes them.
     */
    imageSizes: v.optional(v.array(v.array(v.string()))),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const existing = await ctx.db.get(args.id);
    const previous = photoValuesByUrl(
      existing?.images,
      existing?.imageColors,
      existing?.imageSizes,
    );
    const photos = cleanPhotos(
      args.images,
      args.imageColors ?? [],
      args.imageSizes ??
        args.images.map((url) => previous.sizesByUrl.get(url.trim()) ?? []),
    );
    if (photos.images.length === 0) {
      throw new Error("IMAGE_REQUIRED");
    }
    await ctx.db.patch(args.id, photos);
    return photos;
  },
});

/**
 * Stock switch used by the storefront's admin 3-dot menu — flips a single
 * flag without touching the rest of the product.
 */
export const setProductSoldOut = mutation({
  args: { adminKey: v.string(), id: v.id("products"), soldOut: v.boolean() },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    await ctx.db.patch(args.id, {
      soldOut: args.soldOut,
      // Starts the 24-hour countdown, or clears it when back in stock.
      soldOutAt: args.soldOut ? Date.now() : undefined,
    });
    return args.id;
  },
});

/* ------------------------------------------------------------------ */
/* Store phone number (editable from the storefront by the admin)      */
/* ------------------------------------------------------------------ */

/** Row in the shared `meta` table that holds the shop's phone number. */
const PHONE_KEY = "phone";

/** Live shop phone — `null` means “still the built-in default”. */
export const getPhone = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", PHONE_KEY))
      .unique();
    return row?.value ?? null;
  },
});

/** Saves the Algerian phone number (digits only) for the whole storefront. */
export const setPhone = mutation({
  args: { adminKey: v.string(), phone: v.string() },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const digits = args.phone.replace(/\D+/g, "");
    if (digits.length < 9) {
      throw new Error("INVALID_PHONE");
    }
    const existing = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", PHONE_KEY))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: digits });
    } else {
      await ctx.db.insert("meta", { key: PHONE_KEY, value: digits });
    }
    return digits;
  },
});

/* ------------------------------------------------------------------ */
/* Store identity — logo & Instagram, editable from the site itself    */
/* ------------------------------------------------------------------ */

/** Live logo + Instagram values; an empty string means “use the default”. */
export const getStoreSettings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("meta").collect();
    const map = new Map(rows.map((row) => [row.key, row.value]));
    return {
      logo: map.get("logo") ?? "",
      instagram: map.get("instagram") ?? "",
      facebook: map.get("facebook") ?? "",
    };
  },
});

/** Saves one identity value (logo photo URL, Instagram or Facebook link). */
export const setStoreSetting = mutation({
  args: {
    adminKey: v.string(),
    key: v.union(
      v.literal("logo"),
      v.literal("instagram"),
      v.literal("facebook"),
    ),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const value = args.value.trim();
    if (args.key !== "logo" && value && !/^https?:\/\//i.test(value)) {
      throw new Error("INVALID_LINK");
    }
    const existing = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("meta", { key: args.key, value });
    }
    return value;
  },
});

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

/** Public category feed used by the home page grid and the admin table. */
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_created")
      .order("asc")
      .collect();
  },
});

export const createCategory = mutation({
  args: {
    adminKey: v.string(),
    slug: v.string(),
    nameAr: v.string(),
    nameEn: v.string(),
    image: v.string(),
    sizes: v.array(v.string()),
    hasSizeGuide: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const slug = args.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug || !args.nameAr.trim() || !args.nameEn.trim() || !args.image.trim()) {
      throw new Error("INVALID_CATEGORY");
    }
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_created")
      .collect();
    if (existing.some((category) => category.slug === slug)) {
      throw new Error("DUPLICATE_SLUG");
    }
    return await ctx.db.insert("categories", {
      slug,
      nameAr: args.nameAr.trim(),
      nameEn: args.nameEn.trim(),
      image: args.image.trim(),
      sizes: args.sizes.map((size) => size.trim()).filter(Boolean),
      hasSizeGuide: args.hasSizeGuide,
      createdAt: Date.now(),
    });
  },
});

export const updateCategory = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("categories"),
    slug: v.string(),
    nameAr: v.string(),
    nameEn: v.string(),
    image: v.string(),
    sizes: v.array(v.string()),
    hasSizeGuide: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const slug = args.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug || !args.nameAr.trim() || !args.nameEn.trim() || !args.image.trim()) {
      throw new Error("INVALID_CATEGORY");
    }
    const all = await ctx.db
      .query("categories")
      .withIndex("by_created")
      .collect();
    if (all.some((category) => category.slug === slug && category._id !== args.id)) {
      throw new Error("DUPLICATE_SLUG");
    }
    const before = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, {
      slug,
      nameAr: args.nameAr.trim(),
      nameEn: args.nameEn.trim(),
      image: args.image.trim(),
      sizes: args.sizes.map((size) => size.trim()).filter(Boolean),
      hasSizeGuide: args.hasSizeGuide,
    });

    // Renaming a category must never orphan the products filed under it.
    if (before && before.slug !== slug) {
      const oldKeys = new Set(
        [before.slug, before.nameAr, before.nameEn, args.id]
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      );
      const products = await ctx.db
        .query("products")
        .withIndex("by_created")
        .collect();
      for (const product of products) {
        if (oldKeys.has((product.category ?? "").trim().toLowerCase())) {
          await ctx.db.patch(product._id, { category: slug });
        }
      }
    }
    return args.id;
  },
});

export const deleteCategory = mutation({
  args: { adminKey: v.string(), id: v.id("categories") },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/* ------------------------------------------------------------------ */
/* Footer slider                                                       */
/* ------------------------------------------------------------------ */

export const listSliders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sliders")
      .withIndex("by_created")
      .order("asc")
      .collect();
  },
});

export const addSlider = mutation({
  args: {
    adminKey: v.string(),
    image: v.string(),
    titleAr: v.string(),
    titleEn: v.string(),
    href: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    if (!args.image.trim()) {
      throw new Error("INVALID_SLIDER");
    }
    return await ctx.db.insert("sliders", {
      image: args.image.trim(),
      titleAr: args.titleAr.trim(),
      titleEn: args.titleEn.trim(),
      href: args.href?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});

export const updateSlider = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("sliders"),
    image: v.string(),
    titleAr: v.string(),
    titleEn: v.string(),
    href: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    if (!args.image.trim()) {
      throw new Error("INVALID_SLIDER");
    }
    await ctx.db.patch(args.id, {
      image: args.image.trim(),
      titleAr: args.titleAr.trim(),
      titleEn: args.titleEn.trim(),
      href: args.href?.trim() || undefined,
    });
    return args.id;
  },
});

export const deleteSlider = mutation({
  args: { adminKey: v.string(), id: v.id("sliders") },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/* ------------------------------------------------------------------ */
/* First-run demo catalogue                                            */
/* ------------------------------------------------------------------ */

const SEED_PRODUCTS = [
  {
    nameAr: "تي شيرت أوفرسايز أسود",
    nameEn: "Black Oversize T-Shirt",
    price: 3200,
    oldPrice: 4000,
    category: "tshirts",
    images: ["/products/p-tee-black.jpg", "/products/p-tee-white.jpg"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    soldOutSizes: ["XXL"],
    colors: ["black", "white"],
    featured: true,
    descriptionAr:
      "قطن مبرشم 240 غرام بقصة أوفرسايز مريحة، حاشية مزدوجة وطبعة مطبوعة لا تتشقق بعد الغسل.",
    descriptionEn:
      "240 gsm combed cotton with a relaxed oversize cut, double-stitched hem and a print that will not crack after washing.",
  },
  {
    nameAr: "تي شيرت أوفرسايز أبيض",
    nameEn: "White Oversize T-Shirt",
    price: 3200,
    category: "tshirts",
    images: ["/products/p-tee-white.jpg"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    soldOutSizes: [],
    colors: ["white", "grey"],
    featured: true,
    descriptionAr:
      "تي شيرت أبيض بلمسة ناعمة وقصة واسعة، مثالي للطبقات مع السراويل Baggy.",
    descriptionEn:
      "A soft white tee with a wide silhouette, made for layering with baggy pants.",
  },
  {
    nameAr: "سويت شيرت هودي أسود ثقيل",
    nameEn: "Heavyweight Black Hoodie",
    price: 6500,
    oldPrice: 7900,
    category: "tshirts",
    images: ["/products/p-hoodie.jpg"],
    sizes: ["S", "M", "L", "XL"],
    soldOutSizes: ["S"],
    colors: ["black", "navy"],
    featured: true,
    descriptionAr:
      "فليس مبطن 400 غرام بغطاء رأس مزدوج وجيوب أمامية، يمنحك أناقة شتوية بلمسة شارع.",
    descriptionEn:
      "400 gsm fleece with a double-layer hood and front pockets for a warm streetwear finish.",
  },
  {
    nameAr: "سروال Baggy كارجو",
    nameEn: "Baggy Cargo Pants",
    price: 5900,
    category: "pants",
    images: ["/products/p-baggy.jpg", "/products/p-denim.jpg"],
    sizes: ["29", "30", "31", "32", "33", "34", "35", "36"],
    soldOutSizes: ["35"],
    colors: ["black", "beige"],
    featured: true,
    descriptionAr:
      "قصة Baggy واسعة بجيوب كارجو متينة وحزام خصر مطاطي، مقاسات من 29 إلى 36.",
    descriptionEn:
      "A wide baggy cut with sturdy cargo pockets and an elasticated waist, sizes 29 to 36.",
  },
  {
    nameAr: "سروال Boyfriend دنيم",
    nameEn: "Boyfriend Denim Pants",
    price: 6200,
    category: "pants",
    images: ["/products/p-denim.jpg"],
    sizes: ["29", "30", "31", "32", "33", "34", "35", "36"],
    soldOutSizes: ["29"],
    colors: ["denim", "black"],
    featured: false,
    descriptionAr:
      "دنيم سميك بغسل داكن وقصة مستقيمة واسعة، راحة كاملة طوال اليوم.",
    descriptionEn:
      "Thick dark-wash denim with a wide straight leg for all-day comfort.",
  },
  {
    nameAr: "طقم رياضي أسود كامل",
    nameEn: "Black Full Tracksuit Set",
    price: 8900,
    oldPrice: 10500,
    category: "sets",
    images: ["/products/p-hoodie.jpg"],
    sizes: ["S", "M", "L", "XL"],
    soldOutSizes: [],
    colors: ["black", "grey"],
    featured: true,
    descriptionAr:
      "طقم من قطعتين (سويت شيرت + سروال) بخطوط جانبية وتفاصيل مخفية، لإطلالة متناسقة.",
    descriptionEn:
      "A two-piece set (sweatshirt + pants) with side stripes and hidden details for a coordinated look.",
  },
  {
    nameAr: "حذاء رياضي أبيض كلاسيك",
    nameEn: "Classic White Sneakers",
    price: 9500,
    category: "shoes",
    images: ["/products/cat-shoes.jpg"],
    sizes: ["40", "41", "42", "43", "44", "45"],
    soldOutSizes: ["45"],
    colors: ["white", "black"],
    featured: false,
    descriptionAr:
      "حذاء جلد صناعي بنعل مطاطي مضاد للانزلاق، خفيف ومريح للاستعمال اليومي.",
    descriptionEn:
      "Synthetic leather upper with a non-slip rubber sole — light and comfortable for daily wear.",
  },
  {
    nameAr: "كاب HA Drip",
    nameEn: "HA Drip Cap",
    price: 2200,
    category: "accessories",
    images: ["/products/p-cap.jpg"],
    sizes: ["ONE SIZE"],
    soldOutSizes: [],
    colors: ["black", "white"],
    featured: false,
    descriptionAr: "كاب قطني مع تطريز HA، حزام خلفي قابل للتعديل.",
    descriptionEn: "Cotton cap with embroidered HA monogram and an adjustable strap.",
  },
];

/** Mirrors CATEGORIES in src/lib/store-data.ts for the first-run seed. */
const SEED_CATEGORIES = [
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

const SEED_SLIDERS = [
  {
    image: "/sliders/hero-1.jpg",
    titleAr: "تي شيرت أوفرسايز",
    titleEn: "T-Shirt Oversize",
    href: "/shop?cat=tshirts",
  },
  {
    image: "/sliders/hero-2.jpg",
    titleAr: "هودي ثقيل",
    titleEn: "Heavyweight Hoodie",
    href: "/shop?cat=tshirts",
  },
  {
    image: "/sliders/hero-3.jpg",
    titleAr: "سراويل واسعة",
    titleEn: "Baggy & Boyfriend",
    href: "/shop?cat=pants",
  },
];

/**
 * Fills the store with a demo catalogue the first time it is opened.
 * SEED_VERSION is only re-checked on fresh environments — existing
 * deployments already carry the current version flag.
 */
const SEED_VERSION = "v2";

export const ensureSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const flag = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", "seeded"))
      .unique();
    if (flag && flag.value === SEED_VERSION) {
      return { seeded: false };
    }

    // First run ever — fill the store with the demo catalogue once.
    if (!flag) {
      const now = Date.now();
      for (let index = 0; index < SEED_PRODUCTS.length; index += 1) {
        const item = SEED_PRODUCTS[index];
        await ctx.db.insert("products", {
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          price: item.price,
          oldPrice: item.oldPrice,
          category: item.category,
          images: item.images,
          sizes: buildSizes(item.sizes, item.soldOutSizes),
          colors: item.colors,
          soldOut: false,
          featured: item.featured,
          descriptionAr: item.descriptionAr,
          descriptionEn: item.descriptionEn,
          createdAt: now - index * 1000,
        });
      }
      for (let index = 0; index < SEED_SLIDERS.length; index += 1) {
        const slide = SEED_SLIDERS[index];
        await ctx.db.insert("sliders", {
          image: slide.image,
          titleAr: slide.titleAr,
          titleEn: slide.titleEn,
          href: slide.href,
          createdAt: now + index * 1000,
        });
      }
      for (let index = 0; index < SEED_CATEGORIES.length; index += 1) {
        const item = SEED_CATEGORIES[index];
        await ctx.db.insert("categories", {
          slug: item.slug,
          nameAr: item.ar,
          nameEn: item.en,
          image: item.image,
          sizes: item.sizes,
          hasSizeGuide: item.hasSizeGuide,
          createdAt: now + index * 1000,
        });
      }
      await ctx.db.insert("meta", { key: "seeded", value: SEED_VERSION });
      return { seeded: true };
    }

    // Very old deployment — bring the version flag up to date. The legacy
    // image upgrades this branch used to do already ran everywhere.
    await ctx.db.patch(flag._id, { value: SEED_VERSION });
    return { seeded: false, upgraded: true };
  },
});

/** The original demo categories, removed once at the owner's request. */
const LEGACY_CATEGORY_SLUGS = [
  "tshirts",
  "pants",
  "sets",
  "shoes",
  "accessories",
];

/**
 * One-shot cleanup: deletes the legacy demo categories so the owner can
 * start fresh with their own. Only rows that still carry a demo photo are
 * touched — categories the owner re-created with uploaded images survive.
 * Guarded by a meta flag so it runs exactly once.
 */
export const purgeLegacyCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const flag = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", "legacy-categories-purged"))
      .unique();
    if (flag) {
      return { purged: 0, alreadyDone: true };
    }

    const all = await ctx.db
      .query("categories")
      .withIndex("by_created")
      .collect();
    let purged = 0;
    for (const category of all) {
      const isLegacyRow =
        LEGACY_CATEGORY_SLUGS.includes(category.slug) &&
        category.image.startsWith("/products/cat-");
      if (isLegacyRow) {
        await ctx.db.delete(category._id);
        purged += 1;
      }
    }

    await ctx.db.insert("meta", {
      key: "legacy-categories-purged",
      value: String(purged),
    });
    return { purged, alreadyDone: false };
  },
});

/* ------------------------------------------------------------------ */
/* Image uploads — admin picks files from their device                 */
/* ------------------------------------------------------------------ */

/** Public URL of a stored image for <img src>. */
export const imageUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/** Hands out a short-lived upload URL for the browser to POST a file to. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
