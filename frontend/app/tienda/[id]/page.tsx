"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/productos/ProductCard";
import { ArrowLeft, Star, Package, MessageCircle } from "lucide-react";

interface SellerProfile {
  id: number;
  store_name: string;
  store_description: string | null;
  avatar_url: string | null;
  member_since: string;
  rating: number | null;
  review_count: number;
  sales_count: number;
  products_count: number;
  products: Product[];
}

export default function SellerStorePage() {
  const { id } = useParams();
  const router = useRouter();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sellers/${id}`)
      .then(({ data }) => setSeller(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  if (!seller) return (
    <div className="flex justify-center items-center min-h-screen text-gray-400">Tienda no encontrada</div>
  );

  const initials = seller.store_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Cover */}
      <div className="relative">
        <div className="h-36 bg-gradient-to-br from-primary-600 to-primary-400" />
        <button onClick={() => router.back()}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>
      </div>

      {/* Profile */}
      <div className="bg-white px-4 pb-4 -mt-1">
        <div className="flex items-end gap-4 -mt-10 mb-3">
          <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-primary-600 overflow-hidden shrink-0">
            {seller.avatar_url
              ? <img src={seller.avatar_url} alt={seller.store_name} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-lg font-black text-gray-900">{seller.store_name}</h1>
            <p className="text-xs text-gray-400">
              Miembro desde {new Date(seller.member_since).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {seller.store_description && (
          <p className="text-sm text-gray-500 mb-4">{seller.store_description}</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-gray-900">{seller.products_count}</p>
            <p className="text-xs text-gray-400">Publicaciones</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-gray-900">{seller.sales_count}</p>
            <p className="text-xs text-gray-400">Ventas</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3 text-center">
            {seller.rating !== null ? (
              <>
                <p className="text-lg font-black text-gray-900 flex items-center justify-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  {seller.rating}
                </p>
                <p className="text-xs text-gray-400">{seller.review_count} reseñas</p>
              </>
            ) : (
              <>
                <p className="text-lg font-black text-gray-400">—</p>
                <p className="text-xs text-gray-400">Sin reseñas</p>
              </>
            )}
          </div>
        </div>

        {/* Mensaje */}
        <a href={`/mensajes/${seller.id}`}
          className="flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 font-bold py-2.5 rounded-2xl text-sm">
          <MessageCircle size={16} />
          Enviar mensaje
        </a>
      </div>

      {/* Productos */}
      <div className="px-4 pt-4">
        <h2 className="section-title mb-3">Productos ({seller.products_count})</h2>
        {seller.products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Sin productos publicados aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {seller.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
