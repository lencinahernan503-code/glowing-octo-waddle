"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, CheckCircle, Star, Package, MessageCircle, TrendingUp, Crown } from "lucide-react";

interface Subscription {
  id: number;
  status: string;
  amount: number;
  start_date: string;
  end_date: string;
}

const BENEFITS = [
  { Icon: Package,       text: "Publicaciones ilimitadas de productos" },
  { Icon: MessageCircle, text: "Chat directo con compradores interesados" },
  { Icon: TrendingUp,    text: "Estadísticas de tu tienda" },
  { Icon: Star,          text: "Badge de vendedor verificado" },
];

export default function SuscripcionPage() {
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get("/subscriptions/my-subscription")
      .then(({ data }) => {
        setActive(data.active);
        setSub(data.subscription);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const { data } = await api.post("/subscriptions/subscribe");
      setSub(data);
      setActive(true);
      setSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al procesar la suscripción");
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("¿Seguro que querés cancelar tu suscripción? Perdés acceso al terminar el período.")) return;
    try {
      await api.post("/subscriptions/cancel");
      setActive(false);
      setSub(sub ? { ...sub, status: "cancelled" } : null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al cancelar");
    }
  };

  const daysLeft = sub
    ? Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  if (success) return (
    <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center px-6 pb-24">
      <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
        <Crown size={48} className="text-primary-600" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">¡Suscripción activada!</h2>
      <p className="text-gray-400 text-center mb-2">Tenés 30 días de acceso completo.</p>
      <p className="text-gray-500 text-center text-sm mb-8">
        Vence el{" "}
        {sub && new Date(sub.end_date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}.
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

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Plan Vendedor</h1>
        {active && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            Activo
          </span>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Estado actual */}
        {sub && (
          <div className={`rounded-2xl p-4 ${
            active ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-700"
          }`}>
            <div className="flex items-center gap-3">
              <Crown size={28} className={active ? "text-yellow-300" : "text-gray-400"} />
              <div>
                <p className="font-black text-lg">Plan Mensual</p>
                {active ? (
                  <p className="text-primary-200 text-sm">
                    Vence en {daysLeft} {daysLeft === 1 ? "día" : "días"} ·{" "}
                    {new Date(sub.end_date).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">Tu suscripción venció o fue cancelada</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Precio */}
        {!active && (
          <div className="bg-white rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Precio mensual</p>
            <p className="text-5xl font-black text-primary-600">$5.000</p>
            <p className="text-gray-400 text-sm mt-1">ARS · Se renueva cada 30 días</p>
          </div>
        )}

        {/* Beneficios */}
        <div className="bg-white rounded-2xl p-5">
          <p className="font-bold text-gray-900 mb-4">¿Qué incluye?</p>
          <div className="space-y-3">
            {BENEFITS.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary-600" />
                </div>
                <p className="text-sm text-gray-700">{text}</p>
                <CheckCircle size={16} className="text-green-500 shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Acción */}
        {!active ? (
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-primary-200">
            {subscribing ? "Activando..." : "Suscribirme por $5.000/mes"}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl text-sm">
              {subscribing ? "Renovando..." : "Renovar 30 días más"}
            </button>
            <button
              onClick={handleCancel}
              className="w-full border border-red-200 text-red-500 font-semibold py-3 rounded-2xl text-sm">
              Cancelar suscripción
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 px-4">
          En modo de prueba el pago se activa automáticamente. En producción se integra con MercadoPago.
        </p>
      </div>
    </div>
  );
}
