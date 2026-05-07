"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Truck, Package, ChevronDown, ChevronUp, Check } from "lucide-react";

interface SellerOrder {
  order_id: number;
  status: string;
  buyer_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_zip: string;
  total: number;
  created_at: string;
  has_shipment: boolean;
  shipment: {
    id: number;
    status: string;
    carrier: string | null;
    tracking_number: string | null;
  } | null;
  items: {
    product_title: string;
    size: string;
    quantity: number;
    unit_price: number;
  }[];
}

const SHIPMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Registrado",
  dispatched: "Despachado",
  in_transit: "En tránsito",
  delivered: "Entregado",
};

const CARRIERS = ["Correo Argentino", "OCA", "Andreani", "DHL", "FedEx", "Otro"];

export default function SellerShipmentsPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState<Record<number, { carrier: string; tracking_number: string; estimated_delivery: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  const fetchOrders = () => {
    api.get("/shipments/seller/pending")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const initForm = (orderId: number) => {
    if (!form[orderId]) {
      setForm((f) => ({ ...f, [orderId]: { carrier: "", tracking_number: "", estimated_delivery: "" } }));
    }
  };

  const toggle = (orderId: number) => {
    setExpanded((prev) => (prev === orderId ? null : orderId));
    initForm(orderId);
  };

  const setField = (orderId: number, key: string, value: string) => {
    setForm((f) => ({ ...f, [orderId]: { ...f[orderId], [key]: value } }));
  };

  const registerShipment = async (order: SellerOrder) => {
    setSaving(order.order_id);
    try {
      const f = form[order.order_id];
      await api.post("/shipments", {
        order_id: order.order_id,
        carrier: f.carrier || null,
        tracking_number: f.tracking_number || null,
        estimated_delivery: f.estimated_delivery || null,
      });
      fetchOrders();
    } finally {
      setSaving(null);
    }
  };

  const updateStatus = async (shipmentId: number, newStatus: string) => {
    setStatusUpdating(shipmentId);
    try {
      await api.patch(`/shipments/${shipmentId}`, { status: newStatus });
      fetchOrders();
    } finally {
      setStatusUpdating(null);
    }
  };

  const NEXT_STATUS: Record<string, string | null> = {
    pending: "dispatched",
    dispatched: "in_transit",
    in_transit: "delivered",
    delivered: null,
  };

  const NEXT_STATUS_LABEL: Record<string, string> = {
    pending: "Marcar como despachado",
    dispatched: "Marcar en tránsito",
    in_transit: "Marcar como entregado",
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Truck size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold">Gestión de envíos</h1>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay órdenes pendientes de envío</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.order_id} className="card overflow-hidden">
              {/* Header de la orden */}
              <button
                onClick={() => toggle(order.order_id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                    <Package size={20} className="text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Orden #{order.order_id}</p>
                    <p className="text-sm text-gray-500">{order.buyer_name} · {order.shipping_city}, {order.shipping_province}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {order.has_shipment ? (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.shipment?.status === "delivered"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {SHIPMENT_STATUS_LABEL[order.shipment?.status || "pending"]}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-700">
                      Sin envío
                    </span>
                  )}
                  {expanded === order.order_id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </button>

              {/* Detalle expandido */}
              {expanded === order.order_id && (
                <div className="border-t px-4 pb-4 pt-4 space-y-4">
                  {/* Productos */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Productos</p>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.product_title} — talle {item.size} x{item.quantity}</span>
                          <span className="text-gray-500">${(item.unit_price * item.quantity).toLocaleString("es-AR")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dirección */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Dirección de envío</p>
                    <p className="text-sm text-gray-700">
                      {order.shipping_address}, {order.shipping_city}, {order.shipping_province} ({order.shipping_zip})
                    </p>
                  </div>

                  {/* Si no tiene envío: formulario para registrar */}
                  {!order.has_shipment && (
                    <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-orange-700">Registrar envío</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Transportista</label>
                          <select
                            className="input mt-1 text-sm"
                            value={form[order.order_id]?.carrier || ""}
                            onChange={(e) => setField(order.order_id, "carrier", e.target.value)}
                          >
                            <option value="">Seleccioná...</option>
                            {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Número de tracking</label>
                          <input
                            className="input mt-1 text-sm"
                            placeholder="Ej: AR123456789"
                            value={form[order.order_id]?.tracking_number || ""}
                            onChange={(e) => setField(order.order_id, "tracking_number", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Entrega estimada</label>
                          <input
                            className="input mt-1 text-sm"
                            type="date"
                            value={form[order.order_id]?.estimated_delivery || ""}
                            onChange={(e) => setField(order.order_id, "estimated_delivery", e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => registerShipment(order)}
                        disabled={saving === order.order_id}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <Truck size={16} />
                        {saving === order.order_id ? "Registrando..." : "Registrar envío"}
                      </button>
                    </div>
                  )}

                  {/* Si ya tiene envío: mostrar info y botón para avanzar estado */}
                  {order.has_shipment && order.shipment && (
                    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Transportista</p>
                          <p className="font-medium">{order.shipment.carrier || "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tracking</p>
                          <p className="font-medium font-mono">{order.shipment.tracking_number || "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Estado actual</p>
                          <p className="font-medium">{SHIPMENT_STATUS_LABEL[order.shipment.status]}</p>
                        </div>
                      </div>

                      {NEXT_STATUS[order.shipment.status] && (
                        <button
                          onClick={() => updateStatus(order.shipment!.id, NEXT_STATUS[order.shipment!.status]!)}
                          disabled={statusUpdating === order.shipment.id}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          <Check size={16} />
                          {statusUpdating === order.shipment.id ? "Actualizando..." : NEXT_STATUS_LABEL[order.shipment.status]}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
