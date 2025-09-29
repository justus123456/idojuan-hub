import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@/types';
import { Package, Eye, Calendar, CreditCard } from 'lucide-react';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrder: (order: Order) => void;
}

export const OrdersModal = ({ isOpen, onClose, onViewOrder }: OrdersModalProps) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Load orders from localStorage
    const savedOrders = localStorage.getItem('buildmart-orders');
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders);
      // Convert date strings back to Date objects
      const ordersWithDates = parsedOrders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        estimatedDelivery: new Date(order.estimatedDelivery)
      }));
      setOrders(ordersWithDates);
    }
  }, [isOpen]);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG')}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

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

  const getStatusLabel = (status: OrderStatus) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (orders.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              My Orders
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground">
              You haven't placed any orders yet. Start by selecting materials from our catalog.
            </p>
            <Button 
              onClick={onClose} 
              className="mt-4 bg-gradient-to-r from-primary to-construction-orange hover:from-primary-hover hover:to-construction-orange/90"
            >
              Start Shopping
            </Button>
          </div>
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
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Order #{order.id}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {order.paymentStatus.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-primary">
                    {formatPrice(order.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mb-3">
                <div className="text-sm text-muted-foreground mb-2">Items:</div>
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-muted rounded-md text-xs"
                    >
                      {item.material.icon} {item.material.name} ({item.quantity})
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 bg-muted rounded-md text-xs">
                      +{order.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mb-3 text-sm">
                <strong>Delivery to:</strong> {order.buyerInfo.name} - {order.buyerInfo.address.slice(0, 50)}...
              </div>

              <Button 
                onClick={() => {
                  onViewOrder(order);
                  onClose();
                }}
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