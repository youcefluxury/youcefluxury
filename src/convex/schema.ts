import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // HA Drip Boys storefront tables
    products: defineTable({
      nameAr: v.string(),
      nameEn: v.string(),
      price: v.number(),
      oldPrice: v.optional(v.number()),
      category: v.string(),
      images: v.array(v.string()),
      /**
       * One colour per photo, aligned by index with `images`: a shopper who
       * taps that colour sees that photo straight away. An empty string means
       * the photo is not tied to a colour. Optional so products whose photos
       * were saved before this feature keep working untouched.
       */
      imageColors: v.optional(v.array(v.string())),
      /**
       * Sizes sold out for each photo, index-aligned with `images`: the photo
       * of the red piece carries the sizes the red piece is out of, and the
       * black photo keeps its own list. Optional so older products still work.
       */
      imageSizes: v.optional(v.array(v.array(v.string()))),
      sizes: v.array(
        v.object({
          label: v.string(),
          available: v.boolean(),
        }),
      ),
      colors: v.array(v.string()),
      /**
       * Sizes sold out for one specific colour: rows like
       * `{ color: "black", sizes: ["S", "M"] }`. Absent colour → all sizes
       * of the global list apply as-is.
       */
      soldOutByColor: v.optional(
        v.array(
          v.object({
            color: v.string(),
            sizes: v.array(v.string()),
          }),
        ),
      ),
      soldOut: v.boolean(),
      /**
       * When the stock ran out. The storefront hides the card 24 hours later
       * (the dashboard keeps listing the product).
       */
      soldOutAt: v.optional(v.number()),
      featured: v.boolean(),
      /**
       * Delivery price for this product in DA. Empty → the shop-wide default
       * applies. Set per order item so the fee survives product edits.
       */
      deliveryFee: v.optional(v.number()),
      descriptionAr: v.string(),
      descriptionEn: v.string(),
      createdAt: v.number(),
    }).index("by_created", ["createdAt"]),

    sliders: defineTable({
      image: v.string(),
      titleAr: v.string(),
      titleEn: v.string(),
      /** Where a hero-slide click leads (e.g. /shop?cat=tshirts). */
      href: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_created", ["createdAt"]),

    categories: defineTable({
      slug: v.string(),
      nameAr: v.string(),
      nameEn: v.string(),
      /** Card photo shown on the home page and the category banner. */
      image: v.string(),
      sizes: v.array(v.string()),
      hasSizeGuide: v.boolean(),
      createdAt: v.number(),
    }).index("by_created", ["createdAt"]),

    orders: defineTable({
      customerName: v.string(),
      phone: v.string(),
      wilayaCode: v.number(),
      wilayaAr: v.string(),
      wilayaFr: v.string(),
      address: v.string(),
      note: v.optional(v.string()),
      paymentMethod: v.string(),
      items: v.array(
        v.object({
          productId: v.string(),
          nameAr: v.string(),
          nameEn: v.string(),
          price: v.number(),
          size: v.string(),
          color: v.string(),
          quantity: v.number(),
          image: v.string(),
          /** Delivery price captured when the order was placed (if any). */
          deliveryFee: v.optional(v.number()),
        }),
      ),
      itemsTotal: v.optional(v.number()),
      deliveryFee: v.optional(v.number()),
      total: v.number(),
      status: v.string(),
      /** Private note from the dashboard (call outcome, delivery info…). */
      adminNote: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_created", ["createdAt"]),

    meta: defineTable({
      key: v.string(),
      value: v.string(),
    }).index("by_key", ["key"])
  },
  {
    schemaValidation: false,
  },
);

export default schema;
