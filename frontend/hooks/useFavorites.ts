import { create } from "zustand";
import { api } from "@/lib/api";

interface FavoritesState {
  ids: Set<number>;
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (productId: number) => Promise<void>;
  isFav: (productId: number) => boolean;
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const { data } = await api.get("/favorites/ids");
      set({ ids: new Set(data), loaded: true });
    } catch {
      // No autenticado — ignorar
    }
  },

  toggle: async (productId) => {
    const ids = new Set(get().ids);
    if (ids.has(productId)) {
      await api.delete(`/favorites/${productId}`);
      ids.delete(productId);
    } else {
      await api.post(`/favorites/${productId}`);
      ids.add(productId);
    }
    set({ ids });
  },

  isFav: (productId) => get().ids.has(productId),
}));
