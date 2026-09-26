import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isValidAdminKey } from "./admin";

/**
 * Delivery fee in DA for one order. The price belongs to the wilaya (see
 * `deliveryPrices`), and a wilaya without its own price pays this default.
 * Mirrors the cart's own calculation in src/components/store/CartDrawer.tsx.
 */
const DEFAULT_DELIVERY_FEE = 900;

const orderItemValidator = v.object({
  productId: v.string(),
  nameAr: v.string(),
  nameEn: v.string(),
  price: v.number(),
  size: v.string(),
  color: v.string(),
  quantity: v.number(),
  image: v.string(),
  /**
   * Legacy per-product delivery price. Kept optional so orders placed before
   * the wilaya-based prices still read back exactly as they were saved.
   */
  deliveryFee: v.optional(v.number()),
});

/** Guest checkout — no customer account is required. */
export const createOrder = mutation({
  args: {
    customerName: v.string(),
    phone: v.string(),
    wilayaCode: v.number(),
    wilayaAr: v.string(),
    wilayaFr: v.string(),
    address: v.string(),
    note: v.optional(v.string()),
    paymentMethod: v.string(),
    items: v.array(orderItemValidator),
    /** Delivery fee shown to the customer — the server recomputes it anyway. */
    deliveryFee: v.optional(v.number()),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const name = args.customerName.trim();
    const phone = args.phone.replace(/\s+/g, "");
    const address = args.address.trim();

    // Error codes are translated on the client (see src/lib/store-data.ts).
    if (name.length < 3) throw new Error("INVALID_NAME");
    if (!/^0\d{8,9}$/.test(phone)) {
      throw new Error("INVALID_PHONE");
    }
    if (!address) throw new Error("INVALID_ADDRESS");
    if (args.items.length === 0) throw new Error("EMPTY_CART");

    const itemsTotal = args.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    // One delivery fee per order: the price of the chosen wilaya, or the
    // shop-wide default when that wilaya has none yet.
    const wilayaPrice = await ctx.db
      .query("deliveryPrices")
      .withIndex("by_code", (q) => q.eq("wilayaCode", args.wilayaCode))
      .unique();
    const deliveryFee =
      wilayaPrice && wilayaPrice.price > 0
        ? wilayaPrice.price
        : DEFAULT_DELIVERY_FEE;
    /*
     * The fee computed above is authoritative and the order total is always
     * derived from it here, so a stale value sent by the browser (a wilaya
     * price edited while the cart was open, for instance) can never block a
     * real order. The client mirrors the same wilaya rule for its display.
     */
    const total = itemsTotal + deliveryFee;

    const orderId = await ctx.db.insert("orders", {
      customerName: name,
      phone,
      wilayaCode: args.wilayaCode,
      wilayaAr: args.wilayaAr,
      wilayaFr: args.wilayaFr,
      address,
      note: args.note?.trim() || undefined,
      paymentMethod: args.paymentMethod,
      items: args.items,
      itemsTotal,
      deliveryFee,
      total,
      status: "new",
      createdAt: Date.now(),
    });

    return {
      id: orderId,
      /** Short numeric order number, e.g. "6529" (shown as #6529). */
      reference: String(Date.now()).slice(-4),
      itemsTotal,
      deliveryFee,
      total,
    };
  },
});

/** Orders manager feed for the /admin dashboard. */
export const listOrders = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      return [];
    }
    return await ctx.db
      .query("orders")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

/** Moves an order through the workflow: new → confirmed → shipped → done. */
export const setOrderStatus = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    const allowed = ["new", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(args.status)) {
      throw new Error("INVALID_STATUS");
    }
    await ctx.db.patch(args.id, { status: args.status });
    return args.id;
  },
});

/** Admin notes — delivery info, call outcome, anything worth remembering. */
export const setOrderNote = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("orders"),
    adminNote: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    await ctx.db.patch(args.id, { adminNote: args.adminNote.trim() || undefined });
    return args.id;
  },
});

/** Removes a test/spam order permanently. */
export const deleteOrder = mutation({
  args: { adminKey: v.string(), id: v.id("orders") },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("UNAUTHORIZED");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});
