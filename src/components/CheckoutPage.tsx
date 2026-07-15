// src/components/CheckoutPage.tsx
import { useEffect, useState } from "react";
import { BuyerInfoForm } from "@/components/BuyerInfoForm";
import PaymentForm from "@/components/PaymentForm";
import type { BuyerInfo, OrderItem, Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createOrder } from "@/lib/ordersService";
import { addOrderToHistory, normalizeOrder } from "@/lib/materialOrderStorage";

interface CheckoutPageProps {
  orderItems: OrderItem[];
  onOrderComplete: (order: Order) => void;
  onBack: () => void;
}

const SERVICE_CHARGE_PERCENT = 0.1;
const TRANSPORT_COST = 10_000;

interface CheckoutState {
  step: "info" | "payment";
  buyer: BuyerInfo | null;
  materialSubtotal: number;
  serviceCharge: number;
  totalAmount: number;
}

export default function CheckoutPage({
  orderItems,
  onOrderComplete,
  onBack,
}: CheckoutPageProps) {
  const { toast } = useToast();

  const [buyer, setBuyer] = useState<BuyerInfo | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<"info" | "payment">("info");

  const [materialSubtotal, setMaterialSubtotal] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const STORAGE_KEY = "checkout_state";

  /* ------------------- Calculate totals ------------------- */
  useEffect(() => {
    if (!orderItems.length) return;

    const subtotal = orderItems.reduce(
      (sum, item) =>
        sum + (item.total_price ?? item.unit_price * item.quantity),
      0
    );
    const service = Math.round(subtotal * SERVICE_CHARGE_PERCENT);
    const total = subtotal + service + TRANSPORT_COST;

    setMaterialSubtotal(subtotal);
    setServiceCharge(service);
    setTotalAmount(total);

    // Persist checkout state
    const state: CheckoutState = {
      step,
      buyer,
      materialSubtotal: subtotal,
      serviceCharge: service,
      totalAmount: total,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [orderItems, step, buyer]);

  /* ------------------- Restore state on mount ------------------- */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed: CheckoutState = JSON.parse(saved);
      setStep(parsed.step ?? "info");
      setBuyer(parsed.buyer ?? null);
      setMaterialSubtotal(parsed.materialSubtotal ?? 0);
      setServiceCharge(parsed.serviceCharge ?? 0);
      setTotalAmount(parsed.totalAmount ?? 0);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /* ------------------- Submit Buyer Info ------------------- */
  const handleBuyerInfoSubmit = async (info: BuyerInfo) => {
    try {
      if (!orderItems.length || materialSubtotal === 0) {
        throw new Error("Invalid order totals");
      }

      const cart = orderItems.map((item) => ({
        material_id: item.material_id!,
        item_type: "material" as const,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const newOrder = await createOrder({
        cart,
        customer: info,
        transportCost: TRANSPORT_COST,
        serviceCharge,
        totalAmount,
        notes: info.notes ?? "",
      });

      setBuyer(info);
      setOrder(newOrder);
      setStep("payment");

      toast({
        title: "Order Created",
        description: `Order #${newOrder.order_number} ready for payment.`,
      });
    } catch (err: any) {
      toast({
        title: "Checkout Error",
        description: err?.message || "Failed to create order",
        variant: "destructive",
        className: "mt-16",
      });
    }
  };

  /* ------------------- Payment Success ------------------- */
  const handlePaymentSuccess = () => {
    if (!order) return;

    const normalized = normalizeOrder(order);
    if (normalized) {
      // Save full order to localStorage for order history / tracking
      localStorage.setItem("last_order", JSON.stringify(normalized));
      addOrderToHistory(normalized);
    }
    localStorage.removeItem(STORAGE_KEY);

    toast({
      title: "Payment Successful 🎉",
      description: `Order #${order.order_number} confirmed.`,
      className: "mt-16",
    });

    onOrderComplete(order);
  };

  /* ------------------- Render ------------------- */
  return (
    <div className="min-h-screen pt-24 px-4 flex justify-center">
      {step === "info" && (
        <BuyerInfoForm
          totalCost={materialSubtotal}
          transportCost={TRANSPORT_COST}
          serviceCharge={serviceCharge}
          onSubmit={handleBuyerInfoSubmit}
          onBack={onBack}
        />
      )}

      {step === "payment" && buyer && order && totalAmount > 0 && (
        <PaymentForm
          buyer={buyer}
          order={order}
          orderId={order.id}
          onSuccess={handlePaymentSuccess}
          onBack={() => setStep("info")}
          onClose={() => setStep("info")}
        />
      )}
    </div>
  );
}
