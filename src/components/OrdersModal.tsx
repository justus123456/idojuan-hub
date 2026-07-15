// src/components/OrdersModal.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Package, Eye } from "lucide-react";
import type { Order } from "@/types";

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrder: (order: Order) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  on_move: "bg-sky-100 text-sky-800",
  at_area: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  paid: "bg-green-200 text-green-900",
};

const formatPrice = (value?: number) =>
  `₦${(value ?? 0).toLocaleString("en-NG")}`;

export default function OrdersModal({ isOpen, onClose, onViewOrder }: OrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /* ---------------- Fetch Orders ---------------- */
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            items:order_items(*, material:materials(*))
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setOrders(data ?? []);
      } catch (err: any) {
        toast({
          title: "Failed to load orders",
          description: err.message ?? "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isOpen, toast]);

  /* ---------------- View Tracking ---------------- */
  const handleViewOrder = (order: Order) => {
    // Persist the active order for reloads
    localStorage.setItem("active_order", JSON.stringify(order));

    // Update parent state
    onViewOrder(order);

    // Close modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-6 pt-24">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5 text-primary" />
            Orders ({orders.length})
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading orders…
          </p>
        )}

        {!loading && orders.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No orders found.
          </p>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemsTotal =
                order.items?.reduce(
                  (sum, item) =>
                    sum + (item.total_price ?? (item.unit_price * item.quantity)),
                  0
                ) ?? 0;

              const serviceCharge = Math.round(itemsTotal * 0.1);
              const transportCost = 10_000;
              const total = itemsTotal + serviceCharge + transportCost;

              return (
                <Card
                  key={order.id}
                  className="p-4 rounded-xl border bg-card hover:shadow-lg transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        Order #{order.order_number}
                      </h3>
                      <Badge
                        className={`uppercase ${
                          STATUS_COLORS[order.order_status ?? ""] ?? "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {order.order_status ?? "pending"}
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOrder(order)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm text-foreground">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.material?.image ? (
                          <img
                            src={item.material.image}
                            alt={item.material.name}
                            className="h-8 w-8 rounded object-contain"
                          />
                        ) : (
                          <div className="h-8 w-8 flex items-center justify-center text-lg bg-muted rounded">
                            🧱
                          </div>
                        )}
                        <span className="truncate">
                          {item.material?.name ?? item.item_type} × {item.quantity}
                        </span>
                        <span className="ml-auto font-medium">
                          {formatPrice(item.total_price ?? (item.unit_price * item.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t space-y-1 text-sm text-foreground">
                    <div className="flex justify-between">
                      <span>Items Total</span>
                      <span>{formatPrice(itemsTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Charge (10%)</span>
                      <span>{formatPrice(serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport</span>
                      <span>{formatPrice(transportCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
