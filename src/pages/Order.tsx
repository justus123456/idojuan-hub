import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { normalizeOrder, readMaterialOrderState, writeMaterialOrderState } from "@/lib/materialOrderStorage";

import type { Order, OrderItem, PaymentStatus } from "@/types";

const paymentBadgeMap: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-200 text-gray-700",
};

const formatPrice = (value?: number) =>
  `₦${Number(value ?? 0).toLocaleString("en-NG")}`;

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- Load order from state ---------------- */
  useEffect(() => {
    const storedOrder = normalizeOrder(readMaterialOrderState().order);
    if (storedOrder && storedOrder.id === id) {
      setOrder(storedOrder);
      writeMaterialOrderState({ order: storedOrder });
    }
    setLoading(false);
  }, [id]);

  /* ---------------- Totals ---------------- */
  const materialTotal = useMemo(() => {
    const items = order?.order_items ?? order?.items ?? [];
    if (items.length) {
      return items.reduce(
        (sum: number, item: OrderItem) =>
          sum + Number(item.total_price ?? item.unit_price * item.quantity),
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

  /* ---------------- Loading / empty state ---------------- */
  if (loading) return <p className="text-center mt-6">Loading order…</p>;
  if (!order)
    return <p className="text-center mt-6">Order not found or expired.</p>;

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

        <p className="mt-4 text-lg font-semibold">
          Total: {formatPrice(totalAmount)}
        </p>
      </div>

      {/* ORDER ITEMS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>

        <div className="space-y-3">
          {(order.order_items ?? order.items ?? []).map((item) => {
            const price = Number(
              item.total_price ?? item.unit_price * item.quantity
            );

            return (
              <div
                key={item.id}
                className="flex justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {item.material?.name ?? item.item_type}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} × {formatPrice(item.unit_price)}
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

        <p>
          <strong>Name:</strong> {order.customer_name}
        </p>
        <p>
          <strong>Email:</strong> {order.customer_email}
        </p>
        <p>
          <strong>Phone:</strong> {order.customer_phone}
        </p>
        <p>
          <strong>Address:</strong> {order.delivery_address}
        </p>
        <p>
          <strong>City / State:</strong> {order.delivery_city},{" "}
          {order.delivery_state}
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={() => navigate("/")}>Place New Order</Button>
      </div>
    </div>
  );
}
