// src/components/PaystackCheckout.tsx
import { useState, useCallback } from "react";
import { usePaystackPayment } from "react-paystack";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/types";
import { markOrderAsPaid } from "@/lib/ordersService";

interface PaystackCheckoutProps {
  email: string;
  amount: number; // Naira
  orderId: string;
  order: Order;
  onSuccess: (ref: { reference: string }) => void;
  onClose: () => void;
}

export default function PaystackCheckout({
  email,
  amount,
  orderId,
  order,
  onSuccess,
  onClose,
}: PaystackCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const cleanEmail = email?.trim().toLowerCase();
  const amountInKobo = Math.round(Number(amount) * 100);

  const metadata = {
    order_id: orderId,
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    custom_fields: [
      { display_name: "Order Number", variable_name: "order_number", value: order.order_number },
      { display_name: "Customer Name", variable_name: "customer_name", value: order.customer_name },
      { display_name: "Customer Phone", variable_name: "customer_phone", value: order.customer_phone },
    ],
  };

  const initializePayment = usePaystackPayment({
    email: cleanEmail,
    amount: amountInKobo,
    publicKey: publicKey!,
    reference: `ORD-${order.order_number}-${Date.now()}`,
    metadata,
  });

  const startPayment = useCallback(() => {
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email",
        variant: "destructive",
        className: "mt-16",
      });
      return;
    }

    if (!amountInKobo || amountInKobo <= 0) {
      toast({
        title: "Invalid amount",
        description: "Payment amount must be greater than zero.",
        variant: "destructive",
        className: "mt-16",
      });
      return;
    }

    if (!publicKey) {
      toast({
        title: "Configuration error",
        description: "Paystack public key is missing",
        variant: "destructive",
        className: "mt-16",
      });
      return;
    }

    setLoading(true);

    if (typeof initializePayment !== "function") {
      toast({
        title: "Payment unavailable",
        description: "Paystack could not be initialized. Please refresh and try again.",
        variant: "destructive",
        className: "mt-16",
      });
      setLoading(false);
      return;
    }

    initializePayment({
      onSuccess: async (ref) => {
        try {
          if (!orderId) throw new Error("Invalid order ID");

          // Mark order as paid
          await markOrderAsPaid(orderId, ref.reference);

          // Persist order state in localStorage to prevent reset
          localStorage.setItem("currentOrder", JSON.stringify({ ...order, paid: true }));

          toast({
            title: "Payment successful",
            description: `Order #${order.order_number} confirmed`,
            className: "mt-16",
          });
          onSuccess(ref);
        } catch (err: any) {
          toast({
            title: "Order update failed",
            description: err?.message || "Payment was successful but order update failed",
            variant: "destructive",
            className: "mt-16",
          });
        } finally {
          setLoading(false);
        }
      },
      onClose: () => {
        setLoading(false);
        onClose();
      },
    });
  }, [cleanEmail, initializePayment, onClose, onSuccess, orderId, publicKey, order, toast]);

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card className="p-6 rounded-2xl shadow-lg border bg-white">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Secure Payment
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          You are about to pay for your order.
        </p>

        {/* ORDER INFO */}
        <div className="space-y-2 text-sm mb-5 border-t pt-3">
          <div className="flex justify-between">
            <span>Order Number</span>
            <span className="font-medium">#{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Email</span>
            <span className="font-medium">{cleanEmail}</span>
          </div>
          <div className="flex justify-between font-semibold text-base">
            <span>Total Amount</span>
            <span>₦{Number(amount).toLocaleString("en-NG")}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full mb-3"
        >
          Back to Details
        </Button>

        {/* PAY BUTTON */}
        <Button
          onClick={startPayment}
          disabled={loading}
          className="w-full h-12 text-base font-semibold rounded-xl flex gap-2 justify-center 
                     bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:opacity-90 transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing payment...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Pay ₦{Number(amount).toLocaleString("en-NG")}
            </>
          )}
        </Button>

        <p className="mt-3 text-xs text-center text-gray-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-4 h-4" />
          Payments are securely processed by Paystack
        </p>
      </Card>
    </div>
  );
}
