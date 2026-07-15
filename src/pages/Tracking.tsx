import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Truck, MapPin, Package } from "lucide-react";
import OrderHistory from "@/components/orderHistory";
import {
  addOrderToHistory,
  clearMaterialOrderRoute,
  clearMaterialOrderState,
  normalizeOrder,
  readMaterialOrderState,
  writeMaterialOrderState,
} from "@/lib/materialOrderStorage";

import type { Order, OrderTrackingEvent, PaymentStatus } from "@/types";

interface TrackingPageProps {
  order?: Order;
  onBack?: () => void;
  onNewOrder?: () => void;
}
const TRACKING_STEPS = [
  { key: "received", label: "Order Received", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "on_move", label: "Out for Delivery", icon: Truck },
  { key: "at_area", label: "Near You", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: Package },
] as const;

const paymentBadgeMap: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-200 text-gray-700",
};

const formatPrice = (value?: number) => `₦${Number(value ?? 0).toLocaleString("en-NG")}`;

export default function TrackingPage({ order: propOrder, onBack, onNewOrder }: TrackingPageProps) {
  const [order, setOrder] = useState<Order | null>(propOrder ?? null);
  const [tracking, setTracking] = useState<OrderTrackingEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  /* ---------------- Load order from prop or localStorage ---------------- */
  useEffect(() => {
    if (propOrder) {
      const normalized = normalizeOrder(propOrder);
      setOrder(normalized);
      writeMaterialOrderState({ order: normalized });
      if (normalized) addOrderToHistory(normalized);
      return;
    }

    const savedState = readMaterialOrderState();
    setOrder(savedState.order ?? null);
    if (savedState.order) addOrderToHistory(savedState.order);
  }, [propOrder]);

  /* ---------------- Fetch tracking events ---------------- */
  useEffect(() => {
    if (!order) return;

    const fetchTracking = async () => {
      try {
        const { data, error } = await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setTracking((data ?? []) as OrderTrackingEvent[]);
      } catch (err) {
        console.error("Tracking fetch failed:", err);
      }
    };

    fetchTracking();
  }, [order]);

  /* ---------------- Totals ---------------- */
  const materialTotal = useMemo(() => {
    const items = order?.order_items ?? order?.items ?? [];
    if (items.length) {
      return items.reduce(
        (sum, item) => sum + Number(item.total_price ?? item.unit_price * item.quantity),
        0
      );
    }

    const transport = Number(order?.transport_cost ?? 0);
    const service = Number(order?.service_charge ?? 0);
    const total = Number(order?.total_amount ?? 0);
    return Math.max(0, total - transport - service);
  }, [order]);

  const transportCost = Number(order?.transport_cost ?? 0);
  const serviceCharge = Number(order?.service_charge ?? 0);
  const totalAmount = materialTotal + transportCost + serviceCharge;

  if (!order) {
    return <p className="text-center mt-6">Loading order…</p>;
  }

  /* ---------------- Render ---------------- */
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 mt-16">
      {/* ORDER SUMMARY */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>

        <div className="mt-3">
          <Badge className={paymentBadgeMap[order.payment_status]}>
            Payment: {order.payment_status.toUpperCase()}
          </Badge>
        </div>

        <p className="mt-4 text-lg font-semibold">Total: {formatPrice(totalAmount)}</p>
      </div>

      {/* TRACKING STEPS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Order Status</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {TRACKING_STEPS.map((step) => {
            const completed = tracking.some((t) => t.status === step.key);
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className={`flex flex-col items-center p-4 rounded-lg border ${
                  completed ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
              >
                <Icon className={`w-8 h-8 mb-2 ${completed ? "text-green-600" : "text-gray-400"}`} />
                <p className="text-sm font-medium">{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ORDER ITEMS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>

        <div className="space-y-3">
          {(order.order_items ?? order.items ?? []).map((item) => {
            const price = Number(item.total_price ?? item.unit_price * item.quantity);

            return (
              <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.material?.name ?? item.item_type}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(price)}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <p>Materials: {formatPrice(materialTotal)}</p>
          <p>Transport: {formatPrice(transportCost)}</p>
          <p>Service Charge: {formatPrice(serviceCharge)}</p>
        </div>

        <div className="mt-3 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
      </div>

      {/* DELIVERY INFO */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
        <p><strong>Name:</strong> {order.customer_name}</p>
        <p><strong>Email:</strong> {order.customer_email}</p>
        <p><strong>Phone:</strong> {order.customer_phone}</p>
        <p><strong>Address:</strong> {order.delivery_address}</p>
        <p><strong>City / State:</strong> {order.delivery_city}, {order.delivery_state}</p>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => {
          if (onBack) {
            onBack();
            return;
          }
          setShowHistory(true);
        }}>
          View Order History
        </Button>
        <Button onClick={() => {
          if (onNewOrder) {
            onNewOrder();
            return;
          }
          clearMaterialOrderState();
          clearMaterialOrderRoute();
          window.location.hash = "#/";
        }}>
          Place New Order
        </Button>
      </div>

      <OrderHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onViewOrder={(selectedOrder) => {
          const normalized = normalizeOrder(selectedOrder);
          if (normalized) {
            setOrder(normalized);
            writeMaterialOrderState({ order: normalized });
          }
          setShowHistory(false);
        }}
      />
    </div>
  );
}
