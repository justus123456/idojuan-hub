// src/components/OrderHistory.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchOrders as fetchRemoteOrders } from "@/lib/ordersService";
import { supabase } from "@/lib/supabaseClient";
import { addOrderToHistory, normalizeOrder, readOrderHistory, writeMaterialOrderState } from "@/lib/materialOrderStorage";
import type { Order, OrderStatus } from "@/types";

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrder: (order: Order) => void;
  isAdmin?: boolean;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-200 text-yellow-900",
  confirmed: "bg-blue-200 text-blue-900",
  on_move: "bg-sky-200 text-sky-900",
  at_area: "bg-orange-200 text-orange-900",
  delivered: "bg-green-200 text-green-900",
  cancelled: "bg-red-200 text-red-900",
};

const formatPrice = (value?: number) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

export default function OrderHistory({
  isOpen,
  onClose,
  onViewOrder,
  isAdmin = false,
}: OrderHistoryProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // ---------------- Fetch Orders ----------------
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user ?? null;

        if (user) {
          const remoteOrders = await fetchRemoteOrders();
          const userOrders = (remoteOrders ?? []).filter(
            (order) => order.customer_id === user.id
          );
          const uniqueOrders = userOrders.filter(
            (order, index, all) =>
              all.findIndex((candidate) => candidate.id === order.id) === index
          );
          setOrders(uniqueOrders);
        } else {
          const localOrders = readOrderHistory();
          const uniqueOrders = localOrders.filter(
            (order, index, all) =>
              all.findIndex((candidate) => candidate.id === order.id) === index
          );
          setOrders(uniqueOrders);
        }
      } catch (error: any) {
        toast({
          title: "Failed to load orders",
          description: error?.message || "Could not fetch order history",
          variant: "destructive",
          className: "mt-16",
        });

        const localOrders = readOrderHistory();
        const uniqueOrders = localOrders.filter(
          (order, index, all) =>
            all.findIndex((candidate) => candidate.id === order.id) === index
        );
        setOrders(uniqueOrders);
      }

      setLoading(false);
    };

    fetchOrders();
  }, [isOpen, toast]);

  // ---------------- Handle View Tracking ----------------
  const handleViewTracking = (order: Order) => {
    const normalized = normalizeOrder(order);
    if (normalized) {
      writeMaterialOrderState({ order: normalized });
      onViewOrder(normalized);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl mt-20 bg-white dark:bg-slate-900 border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Order History</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="text-center text-sm text-muted-foreground">
            Loading order history…
          </p>
        )}

        {!loading && orders.length === 0 && (
          <Card className="p-6 text-center bg-muted border">
            <p className="text-muted-foreground">No previous orders found.</p>
          </Card>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="p-4 rounded-xl border bg-white dark:bg-slate-800 text-foreground"
              >
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Order #{order.order_number}</h3>

                    <Badge className={statusColors[order.order_status]}>
                      {order.order_status.replace("_", " ").toUpperCase()}
                    </Badge>

                    <p className="text-sm">Total: {formatPrice(order.total_amount)}</p>
                    <p className="text-sm">Payment: {order.payment_status.toUpperCase()}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleViewTracking(order)}>
                      View Tracking
                    </Button>

                    {isAdmin && (
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
