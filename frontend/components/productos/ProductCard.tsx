"use client";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface Props {
  product: Product;
  compact?: boolean;
}

const CATEGORY_STYLE: Record<string, { bg: string; emoji: string }> = {
  remeras:    { bg: "from-blue-100 to-blue-50",    emoji: "👕" },
  pantalones: { bg: "from-indigo-100 to-indigo-50", emoji: "👖" },
  vestidos:   { bg: "from-pink-100 to-pink-50",    emoji: "👗" },
  camperas:   { bg: "from-orange-100 to-orange-50", emoji: "🧥" },
  buzos:      { bg: "from-gray-100 to-gray-50",     emoji: "🧣" },
  calzado:    { bg: "from-amber-100 to-amber-50",   emoji: "👟" },
  accesorios: { bg: "from-purple-100 to-purple-50", emoji: "👜" },
  bijouterie: { bg: "from-yellow-100 to-yellow-50", emoji: "💍" },
  deportiva:  { bg: "from-green-100 to-green-50",   emoji: "⚡" },
  interior:   { bg: "from-rose-100 to-rose-50",     emoji: "🧸" },
  otros:      { bg: "from-gray-100 to-gray-50",     emoji: "📦" },
};

function Placeholder({ category, size = "lg" }: { category: string; size?: "sm" | "lg" }) {
  const style = CATEGORY_STYLE[category] || { bg: "from-primary-100 to-primary-50", emoji: "🛍️" };
  return (
    <div className={`w-full h-full bg-gradient-to-br ${style.bg} flex items-center justify-center`}>
      <span className={size === "sm" ? "text-3xl" : "text-5xl"}>{style.emoji}</span>
    </div>
  );
}

function SellerAvatar({ name, id }: { name?: string; id: number }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : `#${id}`;
  return (
    <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow">
      {initials}
    </div>
  );
}

export default function ProductCard({ product, compact = false }: Props) {
  const mainImage = product.images.find((i) => i.is_main) || product.images[0];
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  if (compact) {
    return (
      <Link href={`/productos/${product.id}`} className="block">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="relative h-36 bg-gray-100">
            {mainImage ? (
              <Image src={`${API}${mainImage.url}`} alt={product.title} fill className="object-cover" />
            ) : (
              <Placeholder category={product.category} size="sm" />
            )}
            <div className="absolute top-2 right-2">
              <FavoriteButton productId={product.id} size={14}
                className="bg-white/90 rounded-full p-1.5 shadow-sm" />
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-sm font-bold text-gray-900 truncate">{product.title}</p>
            <p className="text-sm font-bold text-primary-600">${product.price.toLocaleString("es-AR")}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/productos/${product.id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
        <div className="relative aspect-square bg-gray-100">
          {mainImage ? (
            <Image src={`${API}${mainImage.url}`} alt={product.title} fill className="object-cover" />
          ) : (
            <Placeholder category={product.category} />
          )}

          {/* Condition badge */}
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
            product.condition === "nuevo"
              ? "bg-green-500 text-white"
              : "bg-white/90 text-gray-600 backdrop-blur-sm"
          }`}>
            {product.condition}
          </span>

          {/* Favorite */}
          <div className="absolute top-2 right-2">
            <FavoriteButton productId={product.id} size={16}
              className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm" />
          </div>

          {/* Seller avatar */}
          <div className="absolute bottom-2 left-2">
            <SellerAvatar name={product.seller_name} id={product.seller_id} />
          </div>
        </div>

        <div className="p-3">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide capitalize font-medium">
            {product.category}
          </p>
          <h3 className="font-semibold text-gray-900 truncate text-sm mt-0.5">{product.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-base font-bold text-primary-600">
              ${product.price.toLocaleString("es-AR")}
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = `${window.location.origin}/productos/${product.id}`;
                const text = `Mirá este producto en Feriant: ${product.title} — $${product.price.toLocaleString("es-AR")}\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="flex items-center gap-1 text-[11px] text-green-600 font-semibold bg-green-50 rounded-full px-2 py-0.5"
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-green-600"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.86L.057 23.885a.5.5 0 0 0 .611.612l6.101-1.474A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.523-5.228-1.435l-.374-.223-3.879.937.955-3.78-.245-.389A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Compartir
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
