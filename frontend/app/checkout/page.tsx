"use client";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, MapPin, ShoppingBag, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [form, setForm] = useState({
    shipping_address: "",
    shipping_city: "",
    shipping_province: "",
    shipping_zip: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/orders", {
        ...form,
        items: items.map((i) => ({
          product_id: i.product.id,
          size: i.size,
          quantity: i.quantity,
        })),
      });
      clear();
      if (data.mp_preference_id) {
        window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.mp_preference_id}`;
      } else {
        setOrderId(data.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al procesar la orden");
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    return (
      <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">¡Compra realizada!</h2>
        <p className="text-gray-400 text-center mb-2">Orden #{orderId}</p>
        <p className="text-gray-500 text-center text-sm mb-8">
          El vendedor preparará tu pedido y te contactará para coordinar el envío.
        </p>
        <Link href="/perfil/ordenes"
          className="bg-primary-600 text-white font-bold px-8 py-3 rounded-2xl text-sm mb-3 inline-block">
          Ver mis compras
        </Link>
        <Link href="/" className="text-primary-600 font-semibold text-sm">
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center px-6 pb-24">
        <ShoppingBag size={48} className="text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium mb-6">Tu carrito está vacío</p>
        <Link href="/explorar" className="bg-primary-600 text-white font-bold px-8 py-3 rounded-2xl text-sm">
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-32">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Finalizar compra</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Resumen */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <ShoppingBag size={16} className="text-primary-600" />
            Resumen del pedido
          </p>
          <div className="space-y-2">
            {items.map((i) => (
              <div key={`${i.product.id}-${i.size}`} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate flex-1 mr-2">
                  {i.product.title} <span className="text-gray-400">talle {i.size}</span> ×{i.quantity}
                </span>
                <span className="font-semibold text-gray-800 shrink-0">
                  ${(i.product.price * i.quantity).toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-black text-primary-600 text-lg">${total().toLocaleString("es-AR")}</span>
          </div>
        </div>

        {/* Formulario envío */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-primary-600" />
              Dirección de envío
            </p>
            <div className="space-y-3">
              {[
                { k: "shipping_address", label: "Calle y número", placeholder: "Ej: Corrientes 1234" },
                { k: "shipping_city", label: "Ciudad", placeholder: "Ej: Buenos Aires" },
                { k: "shipping_province", label: "Provincia", placeholder: "Ej: Buenos Aires" },
                { k: "shipping_zip", label: "Código postal", placeholder: "Ej: 1043" },
              ].map(({ k, label, placeholder }) => (
                <div key={k}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
                  <input
                    className="input"
                    placeholder={placeholder}
                    value={(form as any)[k]}
                    onChange={(e) => set(k, e.target.value)}
                    required
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                  Notas <span className="normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  className="input h-20 resize-none text-sm"
                  placeholder="Ej: dejar en portería, timbre 2..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{error}</div>
          )}

          {/* Botón fijo */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 max-w-lg mx-auto">
            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-200">
              <ShoppingBag size={18} />
              {loading ? "Procesando..." : `Confirmar compra · $${total().toLocaleString("es-AR")}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
