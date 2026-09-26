import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isValidAdminKey } from "./admin";

/**
 * Shop-wide delivery price in DA, used for every wilaya that does not carry a
 * price of its own. Mirrors DEFAULT_DELIVERY_FEE in src/convex/orders.ts and
 * STORE.deliveryFee in src/lib/store-data.ts.
 */
const DEFAULT_DELIVERY_PRICE = 900;

/** Highest wilaya code the shop prices (Algeria has 58 numbered wilayas). */
const MAX_WILAYA_CODE = 58;

/**
 * Public price list shown on /delivery and used by the cart: the shop-wide
 * default plus every wilaya that has its own price.
 */
export const listDeliveryPrices = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("deliveryPrices").collect();
    const defaultRow = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", "delivery-price"))
      .unique();
    const savedDefault = Number(defaultRow?.value ?? "");

    return {
      defaultPrice:
        Number.isFinite(savedDefault) && savedDefault > 0
          ? savedDefault
          : DEFAULT_DELIVERY_PRICE,
      prices: rows
        .map((row) => ({ code: row.wilayaCode, price: row.price }))
        .sort((left, right) => left.code - right.code),
    };
  },
});

/**
 * Sets the delivery price of one wilaya (in DA). A price of 0 — or an empty
 * field, which the dashboard sends as 0 — removes the wilaya from the list so
 * it goes back to the shop-wide default.
 */
export const setDeliveryPrice = mutation({
  args: {
    adminKey: v.string(),
    wilayaCode: v.number(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const code = Math.round(args.wilayaCode);
    if (!Number.isFinite(code) || code < 1 || code > MAX_WILAYA_CODE) {
      throw new Error("INVALID_WILAYA");
    }
    const price = Math.max(0, Math.round(args.price));
    if (!Number.isFinite(price)) {
      throw new Error("INVALID_PRICE");
    }

    const existing = await ctx.db
      .query("deliveryPrices")
      .withIndex("by_code", (q) => q.eq("wilayaCode", code))
      .unique();

    if (price === 0) {
      if (existing) await ctx.db.delete(existing._id);
      return { code, price: 0, removed: true };
    }
    if (existing) {
      await ctx.db.patch(existing._id, { price });
    } else {
      await ctx.db.insert("deliveryPrices", { wilayaCode: code, price });
    }
    return { code, price, removed: false };
  },
});
