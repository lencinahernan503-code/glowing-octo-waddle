"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { X, Tag } from "lucide-react";

interface Props {
  productId: number;
  productTitle: string;
  originalPrice: number;
  sizes: { size: string; stock: number }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function OfferModal({ productId, productTitle, originalPrice, sizes, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [size, setSize] = useState(sizes.find(s => s.stock > 0)?.size || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pct = amount ? Math.round((1 - Number(amount) / originalPrice) * 100) : 0;
  const valid = Number(amount) > 0 && Number(amount) < originalPrice && size;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/offers", {
        product_id: productId,
        amount: Number(amount),
        size,
        message: message.trim() || null,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al enviar la oferta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10" onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-primary-600" />
            <h2 className="text-lg font-black text-gray-900">Hacer oferta</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 truncate">
          <span className="font-semibold text-gray-700">{productTitle}</span>
          {" · "}Precio original: <span className="text-primary-600 font-bold">${originalPrice.toLocaleString("es-AR")}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Talle */}
          {sizes.length > 0 && (
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Talle</label>
              <div className="flex flex-wrap gap-2">
                {sizes.filter(s => s.stock > 0).map((s) => (
                  <button key={s.size} type="button" onClick={() => setSize(s.size)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                      size === s.size
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-200 text-gray-600"
                    }`}>
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">Tu oferta</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
              <input
                type="number" min="1" max={originalPrice - 1} step="1"
                className="input pl-8 text-xl font-black text-primary-600"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {amount && Number(amount) > 0 && (
              <div className="mt-2 flex items-center gap-2">
                {pct > 0 ? (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">
                    {pct}% menos que el precio original
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg">
                    La oferta debe ser menor al precio original
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mensaje */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">
              Mensaje <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              className="input h-20 resize-none text-sm"
              placeholder="Ej: Hola, me interesa mucho. ¿Aceptás este precio?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={!valid || loading}
            className={`w-full font-bold py-3.5 rounded-2xl text-sm transition-all ${
              valid && !loading ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}>
            {loading ? "Enviando..." : "Enviar oferta"}
          </button>
        </form>
      </div>
    </div>
  );
}
