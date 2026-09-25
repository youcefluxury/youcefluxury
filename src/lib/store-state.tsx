import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type CartItem = {
  key: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
  /** Delivery price for this product (undefined → shop default applies). */
  deliveryFee?: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "hadrip.cart.v1";

/**
 * Flies a small product thumbnail from the source element to the header cart
 * button (#cart-anchor). Safe no-op when either element is missing.
 */
export function flyToCart(source: HTMLElement | null, image?: string) {
  const target = document.getElementById("cart-anchor");
  if (!source || !target) return;
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.style.cssText = [
    "position:fixed",
    `left:${from.left + from.width / 2 - 22}px`,
    `top:${from.top + from.height / 2 - 22}px`,
    "width:44px",
    "height:44px",
    "z-index:9999",
    "pointer-events:none",
    "border-radius:9999px",
    "overflow:hidden",
    "box-shadow:0 12px 30px -10px rgba(0,0,0,0.5)",
    "transition:transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease",
  ].join(";");
  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover";
    ghost.appendChild(img);
  } else {
    ghost.style.background = "#0a0a0a";
  }
  document.body.appendChild(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.25)`;
    ghost.style.opacity = "0.35";
  });
  window.setTimeout(() => ghost.remove(), 750);
}

/**
 * Same protection as the language context: one shared identity per context on
 * `globalThis`, so a hot reload can never split the providers from the hooks
 * (which showed up as "must be used inside <Provider>" runtime errors).
 */
const storeContexts = globalThis as typeof globalThis & {
  __hadripCartContext__?: ReturnType<typeof createContext<CartContextValue | null>>;
};

const CartContext =
  storeContexts.__hadripCartContext__ ??
  (storeContexts.__hadripCartContext__ = createContext<CartContextValue | null>(null));

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — the shop still works in memory */
  }
}

export function itemKey(productId: string, size: string, color: string) {
  return `${productId}__${size}__${color}`;
}

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(CART_STORAGE_KEY, []),
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    writeStorage(CART_STORAGE_KEY, items);
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "key" | "quantity">, quantity = 1) => {
      const key = itemKey(item.productId, item.size, item.color);
      setItems((current) => {
        const existing = current.find((entry) => entry.key === key);
        if (existing) {
          return current.map((entry) =>
            entry.key === key
              ? { ...entry, quantity: entry.quantity + quantity }
              : entry,
          );
        }
        return [...current, { ...item, key, quantity }];
      });
    },
    [],
  );

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((entry) => entry.key !== key));
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      current
        .map((entry) =>
          entry.key === key ? { ...entry, quantity: Math.max(0, quantity) } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return {
      items,
      count,
      subtotal,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    };
  }, [items, isOpen, addItem, removeItem, setQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}
