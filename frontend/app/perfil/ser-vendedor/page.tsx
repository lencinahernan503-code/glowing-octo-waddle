"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Store, CheckCircle, Tag, MessageCircle, TrendingUp } from "lucide-react";

export default function SerVendedorPage() {
  const { becomeSeller } = useAuth();
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await becomeSeller(storeName.trim(), storeDesc.trim() || undefined);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al activar tu cuenta de vendedor");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-primary-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">¡Ya sos vendedor!</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Tu tienda está lista. Ahora podés publicar productos y empezar a vender.
        </p>
        <button
          onClick={() => router.push("/vendedor/nuevo")}
          className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl text-sm mb-3">
          Publicar mi primer producto
        </button>
        <button
          onClick={() => router.push("/vendedor")}
          className="w-full border-2 border-primary-600 text-primary-600 font-bold py-4 rounded-2xl text-sm">
          Ver mi tienda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Convertirme en vendedor</h1>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* Beneficios */}
        <div className="bg-primary-600 rounded-2xl p-5 text-white">
          <p className="font-black text-lg mb-4">¿Por qué vender en Feriant?</p>
          <div className="space-y-3">
            {[
              { Icon: Tag, text: "Publicá gratis — sin comisiones hasta tu primera venta" },
              { Icon: MessageCircle, text: "Chat directo con compradores interesados" },
              { Icon: TrendingUp, text: "Recibí ofertas y negociá el precio" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <p className="text-sm text-white/90 leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Store size={18} className="text-primary-600" />
            <p className="font-bold text-gray-900">Configurá tu tienda</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Nombre de tu tienda <span className="text-red-400">*</span>
            </label>
            <input
              className="input"
              placeholder="Ej: Ropa de Mili, EstiloUrban, SportShop..."
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-400 mt-1">{storeName.length}/50 caracteres</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Descripción <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              className="input h-24 resize-none text-sm"
              placeholder="Contá qué vendés, tu estilo, marcas favoritas..."
              value={storeDesc}
              onChange={(e) => setStoreDesc(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">{storeDesc.length}/200 caracteres</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!storeName.trim() || loading}
            className={`w-full font-bold py-4 rounded-2xl text-sm transition-all ${
              storeName.trim() && !loading
                ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}>
            {loading ? "Activando tu cuenta..." : "Activar cuenta de vendedor"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 px-4">
          Al continuar aceptás los términos de Feriant. Tu rol cambiará de Comprador a Vendedor.
        </p>
      </div>
    </div>
  );
}
