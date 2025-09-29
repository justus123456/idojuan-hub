import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { OrderItem } from '@/types';
import { ShoppingCart, Trash2 } from 'lucide-react';

interface OrderSummaryProps {
  orderItems: OrderItem[];
  onClearOrder: () => void;
  onProceedToCheckout: () => void;
}

export const OrderSummary = ({ 
  orderItems, 
  onClearOrder, 
  onProceedToCheckout 
}: OrderSummaryProps) => {
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG')}`;
  };

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const orderTotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (orderItems.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
        </h2>
        
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Your order is empty</p>
          <p className="text-sm">Add materials to see them here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <ShoppingCart className="h-5 w-5" />
        Order Summary
      </h2>

      <div className="space-y-3 mb-4">
        {orderItems.map((item) => (
          <div key={item.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{item.material.name}</span>
                <Badge 
                  variant={item.quality === 'premium' ? 'default' : 'secondary'}
                  className="text-xs"
                >
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

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Items:</span>
          <span className="font-medium">{totalItems}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-primary">
          <span>Order Total:</span>
          <span>{formatPrice(orderTotal)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onClearOrder}
          className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button 
          onClick={onProceedToCheckout}
          className="flex-1 bg-gradient-to-r from-primary to-construction-orange hover:from-primary-hover hover:to-construction-orange/90"
        >
          Proceed to Checkout
        </Button>
      </div>
    </Card>
  );
};