import { create } from "zustand";
import { User } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  becomeSeller: (storeName: string, storeDescription?: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: "buyer" | "seller";
  store_name?: string;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      set({ token, user: JSON.parse(user) });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    set({ token: data.access_token, user: data.user });
  },

  register: async (registerData) => {
    const { data } = await api.post("/auth/register", registerData);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    set({ token: data.access_token, user: data.user });
  },

  becomeSeller: async (store_name, store_description) => {
    const { data } = await api.post("/auth/become-seller", { store_name, store_description });
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    set({ token: data.access_token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
}));
