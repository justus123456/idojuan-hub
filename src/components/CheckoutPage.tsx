import { useState } from "react";
import { BuyerInfoForm } from "@/components/BuyerInfoForm";
import { PaymentForm } from "@/components/PaymentForm";
import type { BuyerInfo, OrderItem, Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

interface CheckoutPageProps {
  orderItems: OrderItem[];
  onOrderComplete: (order: Order) => void;
  onBack: () => void;
}

export default function CheckoutPage({
  orderItems,
  onOrderComplete,
  onBack,
}: CheckoutPageProps) {
  const { toast } = useToast();
  const [buyer, setBuyer] = useState<BuyerInfo | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);

  const SERVICE_CHARGE = 500;
  const DELIVERY_FEE_PER_KM = 100;

  const calculateDeliveryFee = (address: string) => DELIVERY_FEE_PER_KM * 5;

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleBuyerInfoSubmit = async (info: BuyerInfo) => {
    try {
      // Save buyer info to Supabase
      const { data, error } = await supabase
        .from("buyers")
        .insert([{
          name: info.name,
          email: info.email,
          phone: info.phone,
          address: info.address,
          city: info.city,
          state: info.state,
          notes: info.notes,
          created_at: new Date()
        }])
        .select()
        .single();

      if (error) throw error;

      setBuyer(info);
      setBuyerId(data.id); // store the Supabase buyer ID
    } catch (err) {
      console.error("Failed to save buyer info:", err);
      toast({ title: "Error", description: "Failed to save buyer info." });
    }
  };

  const handlePaymentSuccess = async (reference: { reference: string }) => {
    if (!buyer || !buyerId) return;

    const deliveryFee = calculateDeliveryFee(buyer.address);
    const totalWithFees = totalAmount + deliveryFee + SERVICE_CHARGE;

    const orderId = crypto.randomUUID();

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([{
        id: orderId,
        order_number: `BM-${Date.now()}`,
        customer_id: buyerId,
        customer_name: buyer.name,
        customer_email: buyer.email,
        customer_phone: buyer.phone,
        delivery_address: buyer.address,
        delivery_city: buyer.city,
        delivery_state: buyer.state,
        notes: buyer.notes,
        total_amount: totalWithFees,
        delivery_fee: deliveryFee,
        payment_status: "paid",
        order_status: "pending",
        paystack_reference: reference.reference,
        status: "active"
      }]);

    if (orderError) {
      toast({ title: "Error", description: orderError.message });
      return;
    }

    // Insert order items
    const itemsToInsert = orderItems.map(item => ({
      order_id: orderId,
      material_id: item.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      item_type: "material",
      property_id: null
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsError) {
      toast({ title: "Error", description: itemsError.message });
      return;
    }

    // Insert initial tracking
    await supabase.from("order_tracking").insert([{
      order_id: orderId,
      status: "pending",
      message: "Order placed",
    }]);

    toast({
      title: "Payment Successful 🎉",
      description: `Order #${orderId} has been placed successfully.`,
    });

    onOrderComplete({
      id: orderId,
      buyerInfo: buyer,
      items: orderItems,
      total: totalWithFees,
      status: "pending",
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      paymentStatus: "paid",
      paymentReference: reference.reference,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {!buyer ? (
        <BuyerInfoForm onSubmit={handleBuyerInfoSubmit} onBack={onBack} />
      ) : (
        <PaymentForm
          buyer={buyer}
          amount={totalAmount}
          orderId={crypto.randomUUID()}
          onSuccess={handlePaymentSuccess}
          onClose={onBack}
        />
      )}
    </div>
  );
}
