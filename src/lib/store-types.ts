import type { Doc } from "@/convex/_generated/dataModel";

/** Shapes of the records stored by the Convex backend. */
export type Product = Doc<"products">;
export type Slider = Doc<"sliders">;
export type Order = Doc<"orders">;
export type OrderItem = Order["items"][number];
export type ProductSize = Product["sizes"][number];
