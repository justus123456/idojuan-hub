import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MaterialCard } from '@/components/MaterialCard';
import { QualitySelector } from '@/components/QualitySelector';
import { QuantityControl } from '@/components/QuantityControl';
import { PriceCalculation } from '@/components/PriceCalculation';
import { OrderSummary } from '@/components/OrderSummary';
import { PaymentForm } from '@/components/PaymentForm';
import { BuyerInfoForm } from '@/components/BuyerInfoForm';
import { OrderTracking } from '@/components/OrderTracking';
import { OrdersModal } from '@/components/OrdersModal';
import { materials } from '@/data/materials';
import type { Material, OrderItem, BuyerInfo, Order, OrderStatus } from '@/types';
import { Construction, Package, History } from 'lucide-react';

type AppStep = 'materials' | 'checkout' | 'payment' | 'tracking';


const Ind = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<AppStep>('materials');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'premium'>('standard');
  const [qualityMultiplier, setQualityMultiplier] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG')}`;
  };

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material);
    setQuantity(1);
    setSelectedQuality('standard');
    setQualityMultiplier(1);
  };

  const handleQualityChange = (quality: string, multiplier: number) => {
    setSelectedQuality(quality as 'standard' | 'premium');
    setQualityMultiplier(multiplier);
  };

  const handleAddToOrder = () => {
    if (!selectedMaterial) return;

    const unitPrice = selectedMaterial.price * qualityMultiplier;
    const totalPrice = unitPrice * quantity;

    const newItem: OrderItem = {
      id: Date.now().toString(),
      material: selectedMaterial,
      quality: selectedQuality,
      qualityMultiplier,
      quantity,
      unitPrice,
      totalPrice
    };

    setOrderItems(prev => [...prev, newItem]);
    
    toast({
      title: "Item Added",
      description: `${selectedMaterial.name} (${selectedQuality}) added to order!`,
    });

    // Reset selection
    setQuantity(1);
    setSelectedQuality('standard');
    setQualityMultiplier(1);
  };

  const handleClearOrder = () => {
    setOrderItems([]);
    toast({
      title: "Order Cleared",
      description: "All items have been removed from your order.",
    });
  };

  const handleProceedToCheckout = () => {
    if (orderItems.length === 0) return;
    setCurrentStep('checkout');
  };

  const handleBuyerInfoSubmit = (buyerInfo: BuyerInfo) => {
    // Create order
    const order: Order = {
      id: Date.now().toString().slice(-8),
      buyerInfo,
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + item.totalPrice, 0),
      status: 'pending',
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      paymentStatus: 'pending'
    };

    // Save order to localStorage
    const existingOrders = localStorage.getItem('buildmart-orders');
    const orders = existingOrders ? JSON.parse(existingOrders) : [];
    orders.push(order);
    localStorage.setItem('buildmart-orders', JSON.stringify(orders));

    setCurrentOrder(order);
    setCurrentStep('tracking');

    toast({
      title: "Order Placed Successfully!",
      description: `Order #${order.id} has been created. You will receive email confirmation shortly.`,
    });

    // Clear order items for next order
    setOrderItems([]);
  };

  const handleCancelOrder = (orderId: string) => {
    if (currentOrder && currentOrder.status !== 'on_move' && currentOrder.status !== 'delivered') {
      const updatedOrder = {
        ...currentOrder,
        status: 'cancelled' as OrderStatus
      };
      
      setCurrentOrder(updatedOrder);

      // Update order in localStorage
      const existingOrders = localStorage.getItem('buildmart-orders');
      if (existingOrders) {
        const orders = JSON.parse(existingOrders);
        const updatedOrders = orders.map((order: Order) => 
          order.id === orderId ? updatedOrder : order
        );
        localStorage.setItem('buildmart-orders', JSON.stringify(updatedOrders));
      }

      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
        variant: "destructive"
      });
    }
  };

  const handleRequestRefund = (orderId: string) => {
    if (currentOrder) {
      const updatedOrder = {
        ...currentOrder,
        paymentStatus: 'refunded' as const
      };
      
      setCurrentOrder(updatedOrder);

      // Update order in localStorage
      const existingOrders = localStorage.getItem('buildmart-orders');
      if (existingOrders) {
        const orders = JSON.parse(existingOrders);
        const updatedOrders = orders.map((order: Order) => 
          order.id === orderId ? updatedOrder : order
        );
        localStorage.setItem('buildmart-orders', JSON.stringify(updatedOrders));
      }

      toast({
        title: "Refund Requested",
        description: "Your refund request has been submitted and will be processed within 3-5 business days.",
      });
    }
  };

  const handleBackToMaterials = () => {
    setCurrentStep('materials');
    setCurrentOrder(null);
  };

  const handleBackToOrder = () => {
    setCurrentStep('materials');
  };

  const handleViewOrder = (order: Order) => {
    setCurrentOrder(order);
    setCurrentStep('tracking');
  };

  if (currentStep === 'tracking' && currentOrder) {
    return (
      <div className="min-h-screen bg-background p-4">
        <OrderTracking
          order={currentOrder}
          onCancelOrder={handleCancelOrder}
          onRequestRefund={handleRequestRefund}
          onBack={handleBackToMaterials}
        />
      </div>
    );
  }

  if (currentStep === 'checkout') {
    return (
      <div className="min-h-screen bg-background p-4">
        <BuyerInfoForm
          onSubmit={handleBuyerInfoSubmit}
          onBack={handleBackToOrder}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-construction-orange/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-construction-orange text-primary-foreground p-8 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Construction className="h-10 w-10" />
              <h1 className="text-4xl font-bold">BuildMart Materials</h1>
            </div>
            
            {/* My Orders Button */}
            <Button
              onClick={() => setShowOrdersModal(true)}
              variant="outline"
              className="bg-white/10 border-white/10 text-white hover:bg-white/20 hover:border-white/50 flex items-center gap-2"
            >
              <History className="h-5 w-5" />
              <span className="hidden sm:inline">My Orders</span>
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-lg opacity-90">
              Premium construction materials delivered to your doorstep across Nigeria
            </p>
            <div className="mt-2 text-sm opacity-75">
              🇳🇬 Proudly serving Nigerian construction industry since 2024
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Materials Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Available Materials */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-foreground">
                <Package className="h-6 w-6" />
                Available Materials
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {materials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    selected={selectedMaterial?.id === material.id}
                    onClick={() => handleMaterialSelect(material)}
                  />
                ))}
              </div>
            </Card>

            {/* Material Calculator */}
            {selectedMaterial && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6 text-foreground">
                  Material Calculator
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Selected Material
                    </label>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="font-medium">{selectedMaterial.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({formatPrice(selectedMaterial.price)}/{selectedMaterial.unit})
                      </span>
                    </div>
                  </div>

                  <QualitySelector
                    selectedQuality={selectedQuality}
                    onQualityChange={handleQualityChange}
                  />

                  <QuantityControl
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    unit={selectedMaterial.unit}
                  />

                  <PriceCalculation
                    material={selectedMaterial}
                    quantity={quantity}
                    qualityMultiplier={qualityMultiplier}
                    selectedQuality={selectedQuality}
                  />

                  <Button
                    onClick={handleAddToOrder}
                    className="w-full bg-gradient-to-r from-primary to-construction-orange hover:from-primary-hover hover:to-construction-orange/90"
                  >
                    Add to Order
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              orderItems={orderItems}
              onClearOrder={handleClearOrder}
              onProceedToCheckout={handleProceedToCheckout}
            />
          </div>
        </div>
      </div>

      {/* My Orders Modal */}
      <OrdersModal
        isOpen={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
        onViewOrder={handleViewOrder}
      />
    </div>
  );
};

export default Ind;