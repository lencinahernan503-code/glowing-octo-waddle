"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Tag, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";

interface Offer {
  id: number;
  product_id: number;
  product_title: string;
  product_image: string | null;
  original_price: number;
  buyer_name: string;
  seller_name: string;
  amount: number;
  size: string;
  message: string | null;
  status: string;
  seller_note: string | null;
  created_at: string;
  discount_pct: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: "Pendiente",  color: "bg-yellow-100 text-yellow-700", icon: Clock },
  accepted:  { label: "Aceptada",   color: "bg-green-100 text-green-700",   icon: CheckCircle },
  rejected:  { label: "Rechazada",  color: "bg-red-100 text-red-600",       icon: XCircle },
  cancelled: { label: "Cancelada",  color: "bg-gray-100 text-gray-500",     icon: XCircle },
  expired:   { label: "Expirada",   color: "bg-gray-100 text-gray-500",     icon: Clock },
};

export default function OffersPage() {
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [sent, setSent] = useState<Offer[]>([]);
  const [received, setReceived] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const { user, hydrate } = useAuth();
  const router = useRouter();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/offers/my-offers").then(({ data }) => setSent(data)),
      user.role === "seller"
        ? api.get("/offers/received").then(({ data }) => setReceived(data))
        : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [user]);

  const respond = async (offerId: number, status: "accepted" | "rejected") => {
    await api.post(`/offers/${offerId}/respond`, { status, seller_note: note || null });
    setResponding(null);
    setNote("");
    api.get("/offers/received").then(({ data }) => setReceived(data));
  };

  const cancel = async (offerId: number) => {
    await api.delete(`/offers/${offerId}`);
    api.get("/offers/my-offers").then(({ data }) => setSent(data));
  };

  const list = tab === "sent" ? sent : received;

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="bg-white px-4 pt-14 pb-0 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 pb-3">
          <button onClick={() => router.back()} className="text-gray-500"><ArrowLeft size={22} /></button>
          <Tag size={20} className="text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900">Ofertas</h1>
        </div>
        {user?.role === "seller" && (
          <div className="flex border-b border-gray-100">
            {(["sent", "received"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === t ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-400"
                }`}>
                {t === "sent" ? "Mis ofertas" : `Recibidas${received.length > 0 ? ` (${received.length})` : ""}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">💸</p>
            <p className="text-gray-500 font-medium">
              {tab === "sent" ? "No enviaste ofertas aún" : "No tenés ofertas pendientes"}
            </p>
            {tab === "sent" && (
              <Link href="/explorar" className="inline-block mt-4 bg-primary-600 text-white font-bold px-6 py-3 rounded-2xl text-sm">
                Explorar productos
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((offer) => {
              const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={offer.id} className="bg-white rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    {offer.product_image ? (
                      <img src={offer.product_image} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">👗</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{offer.product_title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Talle {offer.size} · {tab === "sent" ? `Vendedor: ${offer.seller_name}` : `Comprador: ${offer.buyer_name}`}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-primary-600 font-black text-base">${offer.amount.toLocaleString("es-AR")}</span>
                        <span className="text-gray-400 text-xs line-through">${offer.original_price.toLocaleString("es-AR")}</span>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-lg">-{offer.discount_pct}%</span>
                      </div>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  {offer.message && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-xl px-3 py-2 italic">"{offer.message}"</p>
                  )}

                  {offer.seller_note && offer.status !== "pending" && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-xl px-3 py-2">
                      <span className="font-semibold">Vendedor:</span> {offer.seller_note}
                    </p>
                  )}

                  {/* Acciones vendedor */}
                  {tab === "received" && offer.status === "pending" && (
                    responding === offer.id ? (
                      <div className="mt-3 space-y-2">
                        <input className="w-full bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none"
                          placeholder="Mensaje opcional para el comprador..." value={note}
                          onChange={(e) => setNote(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => respond(offer.id, "accepted")}
                            className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm">
                            ✅ Aceptar
                          </button>
                          <button onClick={() => respond(offer.id, "rejected")}
                            className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm">
                            ❌ Rechazar
                          </button>
                          <button onClick={() => setResponding(null)}
                            className="px-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-sm">
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setResponding(offer.id)}
                        className="mt-3 w-full bg-primary-50 text-primary-600 font-bold py-2.5 rounded-xl text-sm">
                        Responder oferta
                      </button>
                    )
                  )}

                  {/* Cancelar (comprador, pendiente) */}
                  {tab === "sent" && offer.status === "pending" && (
                    <button onClick={() => cancel(offer.id)}
                      className="mt-3 w-full bg-gray-100 text-gray-500 font-semibold py-2 rounded-xl text-sm">
                      Cancelar oferta
                    </button>
                  )}

                  {/* Ver producto */}
                  <Link href={`/productos/${offer.product_id}`}
                    className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-primary-600">
                    Ver producto <ChevronRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
