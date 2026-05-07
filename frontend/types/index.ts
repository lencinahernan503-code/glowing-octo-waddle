export type UserRole = "buyer" | "seller" | "admin";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  store_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface ProductSize {
  id: number;
  size: string;
  stock: number;
}

export interface ProductImage {
  id: number;
  url: string;
  is_main: boolean;
}

export type ProductCategory =
  | "remeras" | "pantalones" | "vestidos" | "camperas" | "buzos"
  | "calzado" | "accesorios" | "bijouterie" | "deportiva" | "interior" | "otros";

export type ProductGender = "hombre" | "mujer" | "unisex" | "nino";

export interface Product {
  id: number;
  seller_id: number;
  seller_name?: string;
  title: string;
  description?: string;
  price: number;
  category: ProductCategory;
  gender: ProductGender;
  brand?: string;
  condition: string;
  is_active: boolean;
  created_at: string;
  images: ProductImage[];
  sizes: ProductSize[];
}

export type OrderStatus =
  | "pending" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  size: string;
  unit_price: number;
  product_title?: string;
}

export interface Order {
  id: number;
  buyer_id: number;
  status: OrderStatus;
  total: number;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_zip: string;
  mp_preference_id?: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}
