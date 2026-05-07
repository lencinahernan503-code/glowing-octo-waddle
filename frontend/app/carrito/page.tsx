"use client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowLeft, Minus, Plus } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { items, remove, updateQuantity, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleCheckout = () => {
    if (!user) { router.push("/auth/login"); return; }
    router.push("/checkout");
  };

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-32">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Mi carrito</h1>
        {items.length > 0 && (
          <span className="bg-primary-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <ShoppingBag size={36} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-700 mb-1">Tu carrito está vacío</h2>
          <p className="text-gray-400 text-sm mb-6">Explorá los productos y agregá lo que te guste</p>
          <Link href="/explorar" className="bg-primary-600 text-white font-bold px-8 py-3 rounded-2xl text-sm">
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3">
          {items.map((item) => {
            const img = item.product.images.find((i) => i.is_main) || item.product.images[0];
            return (
              <div key={`${item.product.id}-${item.size}`} className="bg-white rounded-2xl p-4 flex gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {img ? (
                    <Image src={`${API}${img.url}`} alt={item.product.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👗</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{item.product.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Talle: {item.size}</p>
                  <p className="text-primary-600 font-bold mt-1">${item.product.price.toLocaleString("es-AR")}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <button onClick={() => remove(item.product.id, item.size)} className="text-gray-300 hover:text-red-400 self-start">
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout bar */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm">Total ({items.length} {items.length === 1 ? "artículo" : "artículos"})</span>
            <span className="text-xl font-black text-primary-600">${total().toLocaleString("es-AR")}</span>
          </div>
          <button onClick={handleCheckout} className="btn-primary">
            Finalizar compra
          </button>
        </div>
      )}
    </div>
  );
}
