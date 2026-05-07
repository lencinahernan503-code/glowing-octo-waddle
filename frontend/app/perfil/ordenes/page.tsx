"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Order, OrderStatus } from "@/types";
import { Package, ChevronRight, ArrowLeft, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Esperando pago",
  paid: "Pago confirmado",
  preparing: "En preparación",
  shipped: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  shipped: "bg-primary-100 text-primary-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { hydrate } = useAuth();
  const router = useRouter();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    api.get("/orders/my-orders")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Mis compras</h1>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={36} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-1">Sin compras aún</h2>
            <p className="text-gray-400 text-sm mb-6">Cuando hagas una compra aparecerá acá</p>
            <Link href="/" className="bg-primary-600 text-white font-bold px-8 py-3 rounded-2xl text-sm inline-block">
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/perfil/ordenes/${order.id}`}
                className="bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Package size={22} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 text-sm">Orden #{order.id}</p>
                    <p className="font-black text-primary-600 text-sm">${order.total.toLocaleString("es-AR")}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                    {" · "}{order.items.length} artículo{order.items.length !== 1 ? "s" : ""}
                  </p>
                  <span className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
