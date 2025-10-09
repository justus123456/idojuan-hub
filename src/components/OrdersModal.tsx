// src/components/OrdersModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@/types';
import { Package, Eye, Calendar, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrder: (order: Order) => void;
  userId?: string; // optional: filter by customer
  isAdmin?: boolean; // show admin actions
}

export const OrdersModal = ({ isOpen, onClose, onViewOrder, userId, isAdmin }: OrdersModalProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchOrders = async () => {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            material:materials(*)
          ),
          order_tracking(*)
        `)
        .order('created_at', { ascending: false });

      if (userId) query = query.eq('customer_id', userId);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
        return;
      }

      setOrders(data as Order[]);
      setLoading(false);
    };

    fetchOrders();
  }, [isOpen, userId]);

  const formatPrice = (price: number) => `₦${price.toLocaleString('en-NG')}`;

  const formatDate = (date: string | Date) => new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'confirmed': return 'bg-primary text-primary-foreground';
      case 'on_move': return 'bg-construction-blue text-white';
      case 'at_area': return 'bg-construction-orange text-white';
      case 'delivered': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: OrderStatus) => status.replace('_', ' ').toUpperCase();

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId);

    if (error) console.error(error);
    else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl text-center py-8">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Loading orders...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!orders.length) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl text-center py-8">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
          <p className="text-muted-foreground">
            You haven't placed any orders yet. Start by selecting materials from our catalog.
          </p>
          <Button onClick={onClose} className="mt-4 bg-gradient-to-r from-primary to-construction-orange hover:from-primary-hover hover:to-construction-orange/90">
            Start Shopping
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            My Orders ({orders.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Order #{order.order_number}</h3>
                    <Badge className={getStatusColor(order.order_status)}>
                      {getStatusLabel(order.order_status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {order.payment_status.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg text-primary">
                    {formatPrice(order.total_amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.order_items.length} item{order.order_items.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Items Preview */}
              <div className="mb-3">
                <div className="text-sm text-muted-foreground mb-2">Items:</div>
                <div className="flex flex-wrap gap-2">
                  {order.order_items.slice(0, 3).map((item) => (
                    <span key={item.id} className="inline-flex items-center px-2 py-1 bg-muted rounded-md text-xs">
                      {item.material?.name} ({item.quantity})
                    </span>
                  ))}
                  {order.order_items.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 bg-muted rounded-md text-xs">
                      +{order.order_items.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mb-3 text-sm">
                <strong>Delivery to:</strong> {order.customer_name} - {order.delivery_address.slice(0, 50)}...
              </div>

              {/* Admin controls */}
              {isAdmin && order.order_status !== 'delivered' && (
                <div className="mb-3 flex gap-2">
                  {order.order_status === 'pending' && (
                    <Button onClick={() => updateOrderStatus(order.id, 'confirmed')} variant="outline">
                      Confirm Order
                    </Button>
                  )}
                  {order.order_status === 'confirmed' && (
                    <Button onClick={() => updateOrderStatus(order.id, 'on_move')} variant="outline">
                      Mark as On Move
                    </Button>
                  )}
                  {order.order_status === 'on_move' && (
                    <Button onClick={() => updateOrderStatus(order.id, 'at_area')} variant="outline">
                      Mark as At Area
                    </Button>
                  )}
                  {order.order_status === 'at_area' && (
                    <Button onClick={() => updateOrderStatus(order.id, 'delivered')} variant="outline">
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              )}

              <Button
                onClick={() => { onViewOrder(order); onClose(); }}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Order Details & Track Progress
              </Button>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
