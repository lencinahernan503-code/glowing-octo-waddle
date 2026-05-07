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
            {product.seller_name && (
              <p className="text-[10px] text-gray-400 truncate max-w-[80px]">{product.seller_name}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
