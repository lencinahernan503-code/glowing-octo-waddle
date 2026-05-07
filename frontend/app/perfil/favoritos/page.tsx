"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/productos/ProductCard";
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get("/favorites")
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <Heart size={20} className="text-red-500 fill-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Favoritos</h1>
        {products.length > 0 && (
          <span className="ml-auto text-sm text-gray-400">{products.length} guardados</span>
        )}
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl aspect-square bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Heart size={36} className="text-red-200" />
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-1">Sin favoritos aún</h2>
            <p className="text-gray-400 text-sm mb-6">Guardá los productos que te gustan tocando el corazón</p>
            <Link href="/explorar" className="bg-primary-600 text-white font-bold px-8 py-3 rounded-2xl text-sm inline-block">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
