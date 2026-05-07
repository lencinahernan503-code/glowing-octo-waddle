import { create } from "zustand";
import { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  add: (product: Product, size: string, quantity?: number) => void;
  remove: (productId: number, size: string) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  add: (product, size, quantity = 1) => {
    const items = get().items;
    const existing = items.find(
      (i) => i.product.id === product.id && i.size === size
    );
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      });
    } else {
      set({ items: [...items, { product, size, quantity }] });
    }
  },

  remove: (productId, size) => {
    set({ items: get().items.filter((i) => !(i.product.id === productId && i.size === size)) });
  },

  updateQuantity: (productId, size, quantity) => {
    if (quantity <= 0) {
      get().remove(productId, size);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product.id === productId && i.size === size ? { ...i, quantity } : i
      ),
    });
  },

  clear: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
}));
