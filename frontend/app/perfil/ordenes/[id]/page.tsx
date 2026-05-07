"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Order, OrderStatus } from "@/types";
import { ArrowLeft, Truck, CheckCircle, Clock, XCircle, CreditCard, Wrench, MapPin, Package } from "lucide-react";

interface Shipment {
  id: number;
  tracking_number: string | null;
  carrier: string | null;
  status: "pending" | "dispatched" | "in_transit" | "delivered";
  estimated_delivery: string | null;
}

const ORDER_STEPS: { status: OrderStatus; label: string; Icon: any }[] = [
  { status: "pending",   label: "Pedido",      Icon: Clock },
  { status: "paid",      label: "Pago",         Icon: CreditCard },
  { status: "preparing", label: "Preparando",   Icon: Wrench },
  { status: "shipped",   label: "En camino",    Icon: Truck },
  { status: "delivered", label: "Entregado",    Icon: CheckCircle },
];

const STEP_INDEX: Partial<Record<OrderStatus, number>> = {
  pending: 0, paid: 1, preparing: 2, shipped: 3, delivered: 4,
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  paid:      "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  shipped:   "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   "Esperando pago",
  paid:      "Pago confirmado",
  preparing: "En preparación",
  shipped:   "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
        try {
          const { data: ship } = await api.get(`/shipments/order/${id}`);
          setShipment(ship);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  if (!order) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <Package size={48} className="text-gray-200 mb-3" />
      <p className="text-gray-500 font-medium">Orden no encontrada</p>
    </div>
  );

  const currentStep = order.status === "cancelled" ? -1 : (STEP_INDEX[order.status] ?? 0);

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-40 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Orden #{order.id}</h1>
          <p className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Timeline */}
        {order.status === "cancelled" ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <XCircle size={24} className="text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-red-700 text-sm">Orden cancelada</p>
              <p className="text-xs text-red-400 mt-0.5">El pago fue rechazado o la orden fue cancelada.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-700 mb-4">Estado del pedido</p>
            <div className="flex items-start justify-between relative">
              {/* Línea de fondo */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100 z-0" />
              {/* Línea de progreso */}
              <div
                className="absolute top-5 left-5 h-0.5 bg-primary-500 z-0 transition-all duration-500"
                style={{ width: currentStep > 0 ? `${(currentStep / (ORDER_STEPS.length - 1)) * (100 - 10)}%` : "0%" }}
              />
              {ORDER_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.status} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? "bg-primary-600 border-primary-600 text-white"
                        : "bg-white border-gray-200 text-gray-300"
                    } ${active ? "ring-4 ring-primary-100" : ""}`}>
                      <step.Icon size={18} />
                    </div>
                    <p className={`text-[10px] text-center font-semibold leading-tight ${
                      done ? "text-primary-700" : "text-gray-300"
                    }`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Productos */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">Productos</p>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {item.product_title || `Producto #${item.product_id}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Talle {item.size} · ×{item.quantity}
                  </p>
                </div>
                <p className="font-bold text-gray-900 text-sm shrink-0 ml-3">
                  ${(item.unit_price * item.quantity).toLocaleString("es-AR")}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
            <span className="font-bold text-gray-900 text-sm">Total</span>
            <span className="font-black text-primary-600">${order.total.toLocaleString("es-AR")}</span>
          </div>
        </div>

        {/* Envío tracking */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Truck size={16} className="text-primary-600" />
            Seguimiento del envío
          </p>
          {!shipment ? (
            <p className="text-sm text-gray-400">El vendedor aún no registró el envío.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {shipment.carrier && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Transportista</span>
                  <span className="font-semibold text-gray-800">{shipment.carrier}</span>
                </div>
              )}
              {shipment.tracking_number && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Tracking</span>
                  <span className="font-mono font-semibold text-gray-800">{shipment.tracking_number}</span>
                </div>
              )}
              {shipment.estimated_delivery && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Entrega estimada</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(shipment.estimated_delivery).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dirección */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-primary-600" />
            Dirección de envío
          </p>
          <p className="text-sm text-gray-700 font-medium">{order.shipping_address}</p>
          <p className="text-sm text-gray-500">{order.shipping_city}, {order.shipping_province} ({order.shipping_zip})</p>
          {order.notes && (
            <p className="text-xs text-gray-400 mt-2 italic">"{order.notes}"</p>
          )}
        </div>
      </div>
    </div>
  );
}
