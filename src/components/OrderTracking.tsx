// src/components/OrderTracking.tsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Order, OrderItem, OrderTrackingEvent } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Truck, MapPin, Package } from "lucide-react";

interface OrderTrackingProps {
  order?: Order; // optional for loading from localStorage
  onBack?: () => void;
  onNewOrder?: () => void;
}

const TRACKING_STEPS = [
  { key: "received", label: "Order Received", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "on_move", label: "Out for Delivery", icon: Truck },
  { key: "at_area", label: "Near You", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: Package },
];

const paymentBadgeMap: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-200 text-gray-700",
};

const formatPrice = (value?: number) =>
  `₦${Number(value || 0).toLocaleString("en-NG")}`;

export default function OrderTracking({ order, onBack, onNewOrder }: OrderTrackingProps) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTrackingEvent[]>([]);

  // ---------------- Load order from props or localStorage ----------------
  useEffect(() => {
    if (order) {
      setCurrentOrder(order);
      localStorage.setItem("active_order", JSON.stringify(order));
    } else {
      const saved = localStorage.getItem("active_order");
      if (saved) setCurrentOrder(JSON.parse(saved));
    }
  }, [order]);

  // ---------------- Fetch tracking events ----------------
  useEffect(() => {
    if (!currentOrder) return;

    const fetchTracking = async () => {
      try {
        const { data, error } = await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", currentOrder.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setTracking(data || []);
      } catch (err) {
        console.error("Failed to fetch tracking:", err);
      }
    };

    fetchTracking();
  }, [currentOrder]);

  // ---------------- Calculate totals ----------------
  const materialTotal = useMemo(() => {
    if (!currentOrder?.order_items?.length) return 0;
    return currentOrder.order_items.reduce(
      (sum: number, item: OrderItem) =>
        sum + Number(item.total_price ?? item.unit_price * item.quantity),
      0
    );
  }, [currentOrder]);

  const transportCost = Number(currentOrder?.transport_cost ?? 0);
  const serviceCharge = Number(currentOrder?.service_charge ?? 0);
  const totalAmount = materialTotal + transportCost + serviceCharge;

  if (!currentOrder) return <p className="text-center mt-6">Loading order...</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* ORDER SUMMARY */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold">Order #{currentOrder.order_number}</h1>
        <div className="mt-3">
          <Badge className={paymentBadgeMap[currentOrder.payment_status]}>
            Payment: {currentOrder.payment_status.toUpperCase()}
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
          {currentOrder.order_items?.map((item) => {
            const price = Number(item.total_price ?? item.unit_price * item.quantity);
            return (
              <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.material?.name ?? item.item_type}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} × {formatPrice(Number(item.unit_price))}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(price)}</p>
              </div>
            );
          })}
        </div>

        {/* Totals */}
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
        <p><strong>Name:</strong> {currentOrder.customer_name}</p>
        <p><strong>Email:</strong> {currentOrder.customer_email}</p>
        <p><strong>Phone:</strong> {currentOrder.customer_phone}</p>
        <p><strong>Address:</strong> {currentOrder.delivery_address}</p>
        <p><strong>City / State:</strong> {currentOrder.delivery_city}, {currentOrder.delivery_state}</p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3">
        {onBack && <Button variant="outline" onClick={onBack}>View Order History</Button>}
        {onNewOrder && <Button onClick={onNewOrder}>Place New Order</Button>}
      </div>
    </div>
  );
}
