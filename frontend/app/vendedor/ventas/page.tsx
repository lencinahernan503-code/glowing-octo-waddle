"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Package, ChevronRight } from "lucide-react";

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  size: string;
  unit_price: number;
  product?: { title: string };
}

interface Order {
  id: number;
  status: string;
  total: number;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  created_at: string;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pendiente",   color: "bg-yellow-100 text-yellow-700" },
  paid:       { label: "Pagado",      color: "bg-blue-100 text-blue-700" },
  preparing:  { label: "Preparando",  color: "bg-orange-100 text-orange-700" },
  shipped:    { label: "Enviado",     color: "bg-indigo-100 text-indigo-700" },
  delivered:  { label: "Entregado",   color: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelado",   color: "bg-red-100 text-red-500" },
};

const NEXT_STATUS: Record<string, string> = {
  paid:      "preparing",
  preparing: "shipped",
  shipped:   "delivered",
};

const NEXT_LABEL: Record<string, string> = {
  paid:      "Marcar en preparación",
  preparing: "Marcar como enviado",
  shipped:   "Marcar como entregado",
};

export default function MisVentasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get("/orders/my-sales")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status?new_status=${newStatus}`);
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch {
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Mis ventas</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aún no recibiste ventas</p>
            <p className="text-gray-400 text-sm mt-1">
              Cuando alguien compre tus productos, aparecerán acá.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const st = STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600" };
            const nextSt = NEXT_STATUS[order.status];
            return (
              <div key={order.id} className="bg-white rounded-2xl p-4">
                {/* Header de orden */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("es-AR", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </p>
                    <p className="font-bold text-gray-900 text-sm">Orden #{order.id}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1 mr-2">
                        Producto #{item.product_id}
                        <span className="text-gray-400"> · talle {item.size} ×{item.quantity}</span>
                      </span>
                      <span className="font-semibold text-gray-800 shrink-0">
                        ${(item.unit_price * item.quantity).toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dirección */}
                <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3">
                  <p className="text-xs text-gray-400 mb-0.5">Enviar a</p>
                  <p className="text-sm text-gray-700 font-medium">
                    {order.shipping_address}, {order.shipping_city}, {order.shipping_province}
                  </p>
                </div>

                {/* Total y acción */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="font-black text-primary-600">${order.total.toLocaleString("es-AR")}</p>
                  </div>
                  {nextSt && (
                    <button
                      onClick={() => updateStatus(order.id, nextSt)}
                      disabled={updating === order.id}
                      className="flex items-center gap-1 bg-primary-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                      {updating === order.id ? "..." : NEXT_LABEL[order.status]}
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
