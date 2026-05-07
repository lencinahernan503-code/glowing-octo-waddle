"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order, OrderStatus } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const ALL_STATUSES: OrderStatus[] = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchOrders = (status?: OrderStatus | "") => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status) params.status = status;
    api.get("/admin/orders", { params })
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusFilter = (status: OrderStatus | "") => {
    setStatusFilter(status);
    fetchOrders(status);
  };

  const updateStatus = async (orderId: number, newStatus: OrderStatus) => {
    setUpdating(orderId);
    try {
      const { data } = await api.patch(`/admin/orders/${orderId}/status`, null, {
        params: { new_status: newStatus },
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, ...data } : o));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
        <p className="text-sm text-gray-500 mt-1">{orders.length} órdenes cargadas</p>
      </div>

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleStatusFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            statusFilter === "" ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
        >
          Todas
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === s
                ? "bg-gray-900 text-white border-gray-900"
                : `${STATUS_COLOR[s]} border-transparent hover:opacity-80`
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Lista de órdenes */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center py-16 text-gray-400">No hay órdenes con ese filtro</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Fila principal */}
              <button
                onClick={() => setExpanded((p) => p === order.id ? null : order.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-6">
                  <div>
                    <p className="font-semibold text-gray-900">Orden #{order.id}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("es-AR", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="hidden sm:block text-sm text-gray-500">
                    {order.shipping_city}, {order.shipping_province}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-primary-600">${order.total.toLocaleString("es-AR")}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                  {expanded === order.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {/* Detalle expandido */}
              {expanded === order.id && (
                <div className="border-t px-4 pb-4 pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Comprador</p>
                      <p className="font-medium">ID #{order.buyer_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Dirección</p>
                      <p className="font-medium">{order.shipping_address}, {order.shipping_city}</p>
                    </div>
                    {order.mp_payment_id && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">ID Pago MP</p>
                        <p className="font-mono text-xs">{order.mp_payment_id}</p>
                      </div>
                    )}
                    {order.notes && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Notas</p>
                        <p className="italic text-gray-600">"{order.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Productos */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2">Artículos</p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">Producto #{item.product_id} · talle {item.size} x{item.quantity}</span>
                          <span className="text-gray-500">${(item.unit_price * item.quantity).toLocaleString("es-AR")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cambiar estado */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2">Cambiar estado</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          disabled={updating === order.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80 ${STATUS_COLOR[s]}`}
                        >
                          → {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
