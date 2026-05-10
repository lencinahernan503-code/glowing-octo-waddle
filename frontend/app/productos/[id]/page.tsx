"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { Product } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, MoreVertical, Star, MessageCircle, ShoppingBag, Share2, Link2, Check } from "lucide-react";
import FavoriteButton from "@/components/ui/FavoriteButton";
import ReviewList from "@/components/productos/ReviewList";
import OfferModal from "@/components/ui/OfferModal";

interface RatingSummary { average: number; count: number; }

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImg, setMainImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { add } = useCart();
  const { user, hydrate } = useAuth();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then(({ data }) => setProduct(data));
    api.get(`/reviews/product/${id}/summary`).then(({ data }) => setSummary(data));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    api.get("/orders/my-orders").then(({ data }) => {
      const bought = data
        .filter((o: any) => o.status === "delivered")
        .some((o: any) => o.items.some((item: any) => item.product_id === Number(id)));
      setCanReview(bought);
    }).catch(() => {});
  }, [user, id]);

  const handleAdd = () => {
    if (!selectedSize || !product) return;
    add(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen pb-32">
      {/* Galería */}
      <div className="relative">
        <div className="relative h-80 bg-gray-100">
          {product.images[mainImg] ? (
            <Image src={`${API}${product.images[mainImg].url}`} alt={product.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gray-100">👗</div>
          )}
        </div>

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-12">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <FavoriteButton productId={product.id} size={18}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center" />
            <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center">
              <MoreVertical size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 px-4 py-3 bg-white">
            {product.images.map((img, i) => (
              <button key={img.id} onClick={() => setMainImg(i)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === mainImg ? "border-primary-500" : "border-transparent"
                }`}>
                <Image src={`${API}${img.url}`} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-4 space-y-4">
        {/* Vendedor */}
        <Link href={`/tienda/${product.seller_id}`} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
            {product.seller_name
              ? product.seller_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
              : product.seller_id.toString().slice(-1)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              {product.seller_name || `Vendedor #${product.seller_id}`}
            </p>
            <p className="text-xs text-gray-400">Ver tienda →</p>
          </div>
          {summary && summary.count > 0 && (
            <div className="flex items-center gap-1">
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">{summary.average}</span>
              <span className="text-xs text-gray-400">({summary.count})</span>
            </div>
          )}
        </Link>

        <div className="h-px bg-gray-100" />

        {/* Nombre y precio */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide capitalize">{product.category} · {product.gender}</p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{product.title}</h1>
          {product.brand && <p className="text-sm text-gray-500 mt-0.5">{product.brand}</p>}
          <p className="text-2xl font-black text-primary-600 mt-2">${product.price.toLocaleString("es-AR")}</p>
        </div>

        {/* Estado y condición */}
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Estado</p>
            <p className="text-sm font-semibold text-gray-800 capitalize">{product.condition}</p>
          </div>
          {product.sizes.length > 0 && (
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Tallas</p>
              <p className="text-sm font-semibold text-gray-800">{product.sizes.map(s => s.size).join(", ")}</p>
            </div>
          )}
        </div>

        {/* Descripción */}
        {product.description && (
          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
        )}

        {/* Talle selector */}
        {product.sizes.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Seleccioná tu talle</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s.id} disabled={s.stock === 0} onClick={() => setSelectedSize(s.size)}
                  className={`px-4 py-2 rounded-2xl border-2 text-sm font-semibold transition-all ${
                    s.stock === 0
                      ? "opacity-30 cursor-not-allowed border-gray-200 text-gray-400"
                      : selectedSize === s.size
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-200 text-gray-700 hover:border-primary-300"
                  }`}>
                  {s.size}
                  {s.stock <= 3 && s.stock > 0 && (
                    <span className="ml-1 text-xs opacity-70">({s.stock})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Acciones secundarias */}
        <div className="flex items-center gap-4">
          <Link href={`/mensajes/${product.seller_id}?product=${product.id}`}
            className="flex items-center gap-2 text-sm text-primary-600 font-semibold">
            <MessageCircle size={16} />
            Consultar al vendedor
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => {
                const url = `${window.location.origin}/productos/${product.id}`;
                navigator.clipboard.writeText(url).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="flex items-center gap-1.5 text-sm text-gray-500 font-semibold">
              {copied ? <Check size={15} className="text-green-500" /> : <Link2 size={15} />}
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/productos/${product.id}`;
                const text = `Mirá este producto en Feriant: ${product.title} — $${product.price.toLocaleString("es-AR")}\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
              <Share2 size={15} />
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Reseñas */}
      <div className="mt-6 px-4 border-t pt-6">
        <ReviewList productId={product.id} canReview={canReview} />
      </div>

      {/* Botones fijos abajo */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 max-w-lg mx-auto">
        {offerSent ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-2xl px-4 py-3 text-center">
            ✅ Oferta enviada — el vendedor te responderá pronto
          </div>
        ) : (
          <>
            {product.sizes.length > 0 && !selectedSize && (
              <p className="text-center text-xs text-orange-500 font-semibold mb-2">
                ☝️ Seleccioná un talle para comprar
              </p>
            )}
            <div className="flex gap-3">
              {user && user.id !== product.seller_id && (
                <button onClick={() => setOfferOpen(true)}
                  className="border-2 border-primary-600 text-primary-600 font-bold py-3 px-4 rounded-2xl text-sm whitespace-nowrap">
                  Hacer oferta
                </button>
              )}
              <button
                onClick={handleAdd}
                disabled={product.sizes.length > 0 && !selectedSize}
                className={`flex-1 font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all ${
                  product.sizes.length > 0 && !selectedSize
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-primary-600 text-white shadow-lg shadow-primary-200"
                }`}>
                <ShoppingBag size={16} />
                {added ? "¡Agregado al carrito!" : product.sizes.length > 0 && !selectedSize ? "Elegí un talle" : "Agregar al carrito"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal oferta */}
      {offerOpen && (
        <OfferModal
          productId={product.id}
          productTitle={product.title}
          originalPrice={product.price}
          sizes={product.sizes}
          onClose={() => setOfferOpen(false)}
          onSuccess={() => { setOfferOpen(false); setOfferSent(true); }}
        />
      )}
    </div>
  );
}
