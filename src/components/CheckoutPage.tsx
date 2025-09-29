import { useState } from "react";
import { PaymentForm } from "@/components/PaymentForm";

import type { BuyerInfo } from "@/types";

export const CheckoutPage = () => {
  const [buyer, setBuyer] = useState<BuyerInfo>({
    name: "John Doe",
    email: "john@example.com",
    phone: "08012345678",
    address: "Abuja, Nigeria",
  });

  const amount = 50000; // ₦50,000 example
  const orderId = "some-order-id"; // This should come from Supabase when you insert the order

  const handlePaymentSuccess = async (reference: any) => {
    console.log("✅ Paystack success:", reference);

    // 1. Update order in Supabase
    const { error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        reference: reference.reference,
      })
      .eq("id", orderId);

    if (error) {
      console.error("❌ Supabase update error:", error);
      alert("Failed to update order.");
      return;
    }

    // 2. Send email via your Resend function
    await fetch("/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: buyer.email,
        subject: "Payment Receipt - IDO-JUAN Properties",
        type: "payment_confirmation",
        customerData: {
          customerName: buyer.name,
          customerEmail: buyer.email,
          customerPhone: buyer.phone,
          amount: amount,
          reference: reference.reference,
          orderId: orderId,
        },
      }),
    });

    alert("✅ Payment confirmed! Receipt sent to your email.");
  };

  const handlePaymentClose = () => {
    console.log("Payment popup closed.");
  };

  return (
    <PaymentForm 
      buyer={buyer} 
      amount={amount} 
      onSuccess={handlePaymentSuccess} 
      onClose={handlePaymentClose} 
    />
  );
};
