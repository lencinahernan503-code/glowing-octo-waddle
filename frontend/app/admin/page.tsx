"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Package, ShoppingBag, DollarSign, TrendingUp, Clock } from "lucide-react";

interface Stats {
  users: { total: number; sellers: number; buyers: number };
  products: { active: number };
  orders: { total: number; by_status: Record<string, number> };
  revenue: number;
  recent_orders: {
    id: number;
    buyer: string;
    total: number;
    status: string;
    created_at: string;
  }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats")
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Usuarios totales",
      value: stats.users.total,
      sub: `${stats.users.sellers} vendedores · ${stats.users.buyers} compradores`,
      icon: <Users size={24} />,
      color: "bg-blue-500",
    },
    {
      label: "Productos activos",
      value: stats.products.active,
      sub: "publicados en la tienda",
      icon: <Package size={24} />,
      color: "bg-purple-500",
    },
    {
      label: "Órdenes totales",
      value: stats.orders.total,
      sub: `${stats.orders.by_status["delivered"] || 0} entregadas`,
      icon: <ShoppingBag size={24} />,
      color: "bg-orange-500",
    },
    {
      label: "Ingresos totales",
      value: `$${stats.revenue.toLocaleString("es-AR")}`,
      sub: "órdenes pagadas y entregadas",
      icon: <DollarSign size={24} />,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general de la plataforma</p>
      </div>

      {/* Cards de stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.color} text-white p-2.5 rounded-lg`}>{card.icon}</div>
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Órdenes por estado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Órdenes por estado</h2>
          <div className="space-y-3">
            {Object.entries(stats.orders.by_status).map(([status, count]) => {
              const pct = stats.orders.total > 0 ? Math.round((count / stats.orders.total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{STATUS_LABEL[status] || status}</span>
                    <span className="font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Últimas órdenes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-700">Últimas órdenes</h2>
          </div>
          <div className="space-y-3">
            {stats.recent_orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">#{order.id} · {order.buyer}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString("es-AR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-600">${order.total.toLocaleString("es-AR")}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
