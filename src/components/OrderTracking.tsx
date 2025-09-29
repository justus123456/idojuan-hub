import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Order, OrderStatus } from '@/types';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface OrderTrackingProps {
  order: Order;
  onCancelOrder: (orderId: string) => void;
  onRequestRefund: (orderId: string) => void;
  onBack: () => void;
}

export const OrderTracking = ({ 
  order, 
  onCancelOrder, 
  onRequestRefund, 
  onBack 
}: OrderTrackingProps) => {
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG')}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const trackingSteps = [
    { key: 'pending', label: 'Order Placed', icon: Package, description: 'Order has been received' },
    { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle, description: 'Order is being prepared' },
    { key: 'on_move', label: 'In Transit', icon: Truck, description: 'Materials are on the way' },
    { key: 'at_area', label: 'Near Delivery', icon: MapPin, description: 'Materials have reached your area' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, description: 'Order has been delivered' }
  ];

  const getCurrentStepIndex = () => {
    if (order.status === 'cancelled') return -1;
    return trackingSteps.findIndex(step => step.key === order.status);
  };

  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canRefund = order.status === 'delivered' && order.paymentStatus === 'paid';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Order Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order #{order.id}</h1>
            <p className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(order.status)}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              Est. delivery: {formatDate(order.estimatedDelivery)}
            </p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4" />
          <span>Payment Status: </span>
          <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
            {order.paymentStatus.toUpperCase()}
          </Badge>
        </div>
      </Card>

      {/* Order Tracking Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 text-foreground">Order Timeline</h2>
        
        <div className="space-y-4">
          {trackingSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = getCurrentStepIndex() >= index;
            const isCurrent = getCurrentStepIndex() === index;
            const isCancelled = order.status === 'cancelled';
            
            return (
              <div key={step.key} className="flex items-center gap-4">
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2
                  ${isCompleted && !isCancelled
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : isCurrent && !isCancelled
                    ? 'bg-construction-orange text-white border-construction-orange animate-pulse'
                    : 'bg-muted text-muted-foreground border-muted-foreground/30'
                  }
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </h3>
                    {isCurrent && !isCancelled && (
                      <Clock className="h-4 w-4 text-construction-orange animate-spin" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
          
          {/* Cancelled Status */}
          {order.status === 'cancelled' && (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-destructive text-destructive-foreground border-destructive">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Order Cancelled</h3>
                <p className="text-sm text-muted-foreground">This order has been cancelled</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Order Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Order Details</h2>
        
        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{item.material.name}</span>
                  <Badge variant={item.quality === 'premium' ? 'default' : 'secondary'} className="text-xs">
                    {item.quality}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.quantity} {item.material.unit}{item.quantity > 1 ? 's' : ''} @ {formatPrice(item.unitPrice)}/{item.material.unit}
                </div>
              </div>
              <div className="font-semibold text-construction-orange">
                {formatPrice(item.totalPrice)}
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />
        
        <div className="flex justify-between text-lg font-bold text-primary">
          <span>Order Total:</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </Card>

      {/* Delivery Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Delivery Information</h2>
        <div className="space-y-2">
          <p><strong>Name:</strong> {order.buyerInfo.name}</p>
          <p><strong>Phone:</strong> {order.buyerInfo.phone}</p>
          <p><strong>Email:</strong> {order.buyerInfo.email}</p>
          <p><strong>Address:</strong> {order.buyerInfo.address}</p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Orders
        </Button>
        
        {canCancel && (
          <Button 
            variant="outline" 
            onClick={() => onCancelOrder(order.id)}
            className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Cancel Order
          </Button>
        )}
        
        {canRefund && (
          <Button 
            variant="outline"
            onClick={() => onRequestRefund(order.id)}
            className="flex-1 text-warning border-warning hover:bg-warning hover:text-warning-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Request Refund
          </Button>
        )}
      </div>
    </div>
  );
};