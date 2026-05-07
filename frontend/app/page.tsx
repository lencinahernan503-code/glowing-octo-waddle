"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/productos/ProductCard";
import Link from "next/link";
import { Bell, ShoppingBag, ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = [
  { label: "Mujer",      emoji: "👗", value: "mujer",      bg: "bg-pink-50",    text: "text-pink-600" },
  { label: "Hombre",     emoji: "👔", value: "hombre",     bg: "bg-blue-50",    text: "text-blue-600" },
  { label: "Zapatillas", emoji: "👟", value: "calzado",    bg: "bg-amber-50",   text: "text-amber-600" },
  { label: "Carteras",   emoji: "👜", value: "accesorios", bg: "bg-purple-50",  text: "text-purple-600" },
  { label: "Buzos",      emoji: "🧥", value: "buzos",      bg: "bg-orange-50",  text: "text-orange-600" },
  { label: "Bijouterie", emoji: "💍", value: "bijouterie", bg: "bg-yellow-50",  text: "text-yellow-600" },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, hydrate } = useAuth();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    api.get("/products", { params: { limit: 12, sort: "newest" } })
      .then(({ data }) => {
        setFeatured(data.slice(0, 5));
        setProducts(data.slice(5));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-gray-400 text-sm">
              {user ? `Hola, ${user.full_name.split(" ")[0]} 👋` : "Bienvenido/a 👋"}
            </p>
            <h1 className="text-xl font-bold text-gray-900">¿Qué buscás hoy?</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/carrito"
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag size={18} className="text-gray-600" />
            </Link>
            <Link href={user ? "/perfil/ordenes" : "/auth/login"}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell size={18} className="text-gray-600" />
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <Link href="/explorar"
          className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3 text-gray-400 text-sm">
          <Search size={16} />
          Buscar productos, marcas...
        </Link>
      </div>

      <div className="px-4 py-4 space-y-6">

        {/* Banner promo */}
        <div className="bg-gradient-to-r from-primary-600 to-violet-500 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/10" />
          <p className="text-xs font-semibold text-primary-200 mb-1 uppercase tracking-wide">Novedad</p>
          <h2 className="text-lg font-black leading-tight mb-3">
            Comprá y vendé<br />sin comisiones
          </h2>
          <Link href={user ? "/explorar" : "/auth/register"}
            className="bg-white text-primary-600 font-bold py-2 px-5 rounded-xl text-sm inline-block">
            {user ? "Explorar ahora" : "Crear cuenta gratis"}
          </Link>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Categorías</h2>
            <Link href="/explorar" className="text-sm text-primary-600 font-medium flex items-center gap-0.5">
              Ver todo <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <Link key={cat.value} href={`/explorar?categoria=${cat.value}`}
                className={`${cat.bg} rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform`}>
                <span className="text-2xl">{cat.emoji}</span>
                <span className={`text-xs font-bold ${cat.text}`}>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Nuevos ingresos */}
        {!loading && featured.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Nuevos ingresos</h2>
              <Link href="/explorar" className="text-sm text-primary-600 font-medium flex items-center gap-0.5">
                Ver todo <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {featured.map((p) => (
                <div key={p.id} className="shrink-0 w-40">
                  <ProductCard product={p} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton categorías */}
        {loading && (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-20 bg-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Recomendados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Para vos</h2>
            <Link href="/explorar" className="text-sm text-primary-600 font-medium flex items-center gap-0.5">
              Ver todo <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 && featured.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🛍️</p>
              <p className="text-gray-500 font-medium">Aún no hay productos</p>
              <p className="text-gray-400 text-sm mt-1">¡Sé el primero en publicar!</p>
              <Link href="/vendedor/nuevo"
                className="inline-block mt-4 bg-primary-600 text-white font-semibold px-6 py-3 rounded-2xl text-sm">
                Publicar producto
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(products.length > 0 ? products : featured).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        {/* Banner vendedor para no logueados */}
        {!user && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="font-black text-gray-900 text-lg mb-1">¿Tenés ropa sin usar?</p>
            <p className="text-gray-400 text-sm mb-4">Publicá gratis y llegá a miles de compradores.</p>
            <Link href="/auth/register"
              className="bg-primary-600 text-white font-bold py-3 px-5 rounded-xl text-sm inline-block w-full text-center">
              Empezar a vender
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
