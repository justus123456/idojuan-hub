// src/components/OrderSummary.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, CreditCard, User, CheckCircle, Truck, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/ordersService";
import type { Order, OrderItem, OrderStatus } from "@/types";

interface OrderSummaryProps {
  isAdmin?: boolean;
  onViewOrder?: (order: Order) => void;
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: "pending", label: "Pending", icon: Package },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle },
  { status: "on_move", label: "On Move", icon: Truck },
  { status: "at_area", label: "At Area", icon: MapPin },
  { status: "delivered", label: "Delivered", icon: CheckCircle },
];

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  on_move: "bg-sky-100 text-sky-800",
  at_area: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrderSummary({ isAdmin = false, onViewOrder }: OrderSummaryProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- Fetch Orders ---------------- */
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, items:order_items(*, material:materials(*))`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data as Order[]);
    } catch (err: any) {
      toast({
        title: "Failed to load orders",
        description: err?.message || "Could not fetch orders",
        variant: "destructive",
        className: "mt-16",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPrice = (price = 0) => `₦${Number(price).toLocaleString("en-NG")}`;
  const formatDate = (date?: string | Date) =>
    date
      ? new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date))
      : "Unknown";

  /* ---------------- Update Order Status ---------------- */
  const updateStatus = async (order: Order, newStatus: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      const { error } = await supabase.from("orders").update({ order_status: newStatus }).eq("id", order.id);
      if (error) throw error;

      await supabase.from("order_tracking").insert({
        order_id: order.id,
        status: newStatus,
        is_completed: true,
        message: `Order marked as ${newStatus.replace("_", " ")}`,
      });

      toast({
        title: "Order Updated",
        description: `Status changed to ${newStatus.replace("_", " ")}`,
        className: "mt-16",
      });

      await fetchOrders();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err?.message || "Could not update order",
        variant: "destructive",
        className: "mt-16",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------------- Handle View Tracking ---------------- */
  const handleViewOrder = (order: Order) => {
    localStorage.setItem("active_order", JSON.stringify(order));
    onViewOrder?.(order);
  };

  if (loading) return <p className="text-center text-sm mt-6">Loading orders...</p>;
  if (!orders.length)
    return (
      <Card className="p-8 text-center bg-white border border-gray-200">
        <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500">No orders found.</p>
      </Card>
    );

  return (
    <div className="space-y-5">
      {orders.map((order) => {
        const materialCost =
          order.items?.reduce((sum: number, item: OrderItem) => sum + (item.total_price ?? (item.unit_price * item.quantity)), 0) || 0;
        const transportCost = order.transport_cost ?? 0;
        const serviceCharge = order.service_charge ?? 0;
        const totalCost = materialCost + transportCost + serviceCharge;

        return (
          <Card key={order.id} className="p-5 rounded-xl border bg-white hover:shadow-lg transition">
            {/* HEADER */}
            <div className="flex flex-wrap justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{`Order #${order.order_number}`}</h3>
                  <Badge className={statusColors[order.order_status] || "bg-gray-200 text-gray-700"}>
                    {order.order_status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(order.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    {order.payment_status.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {order.customer_name}
                  </span>
                </div>
              </div>

              <div className="text-lg font-bold text-primary">{formatPrice(totalCost)}</div>
            </div>

            {/* ITEMS */}
            <div className="space-y-2 mb-4 text-foreground">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.material?.name || item.item_type} × {item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.total_price ?? (item.unit_price * item.quantity))}</span>
                </div>
              ))}
            </div>

            {/* STATUS CONTROLS */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="bg-white text-foreground hover:bg-gray-50"
                onClick={() => handleViewOrder(order)}
              >
                View Tracking
              </Button>

              {isAdmin && (
                <div className="flex gap-2 flex-wrap">
                  {STATUS_STEPS.map((step, index) => {
                    const completed = STATUS_STEPS.findIndex((s) => s.status === order.order_status) >= index;
                    const Icon = step.icon;

                    return (
                      <button
                        key={step.status}
                        disabled={updatingId === order.id || completed || STATUS_STEPS[index - 1]?.status !== order.order_status}
                        onClick={() => updateStatus(order, step.status)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition ${
                          completed
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
