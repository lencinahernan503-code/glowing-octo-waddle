"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Product } from "@/types";
import Image from "next/image";
import { Plus, Eye, EyeOff, Package, TrendingUp, ArrowLeft, ShoppingBag } from "lucide-react";

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get("/products/seller/my-products")
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (p: Product) => {
    await api.patch(`/products/${p.id}`, { is_active: !p.is_active });
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const active = products.filter(p => p.is_active).length;

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Mis publicaciones</h1>
        <Link href="/vendedor/nuevo"
          className="bg-primary-600 text-white text-sm font-bold px-4 py-2 rounded-2xl flex items-center gap-1">
          <Plus size={16} /> Publicar
        </Link>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-primary-600" />
              <p className="text-xs text-gray-400 font-medium">Total publicados</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-500" />
              <p className="text-xs text-gray-400 font-medium">Activos</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{active}</p>
          </div>
        </div>

        {/* Acceso rápido a ventas */}
        <Link href="/vendedor/ventas"
          className="bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">Mis ventas</p>
            <p className="text-xs text-gray-400">Ver pedidos que recibiste</p>
          </div>
          <Eye size={16} className="text-gray-300" />
        </Link>

        {/* Tabs */}
        <div className="flex gap-2">
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary-600 text-white">
            Publicados
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white text-gray-500">
            Borradores
          </button>
        </div>

        {/* Products list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aún no publicaste nada</p>
            <Link href="/vendedor/nuevo"
              className="inline-block mt-4 bg-primary-600 text-white font-bold px-6 py-3 rounded-2xl text-sm">
              Publicar primer producto
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 overflow-hidden relative">
                  {p.images[0] ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${p.images[0].url}`}
                      alt={p.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👗</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.title}</p>
                  <p className="text-primary-600 font-bold text-sm">${p.price.toLocaleString("es-AR")}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.is_active ? "Activo" : "Oculto"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/productos/${p.id}`} className="text-gray-300 hover:text-gray-500">
                    <Eye size={18} />
                  </Link>
                  <button onClick={() => toggleActive(p)} className="text-gray-300 hover:text-primary-600">
                    {p.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
