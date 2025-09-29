import { useEffect } from "react";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaystackCheckoutProps {
  email: string;      // Customer's email
  amount: number;     // Amount in Naira
  orderId: string;    // Your order ID
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function PaystackCheckout({
  email,
  amount,
  orderId,
  onSuccess,
  onClose,
}: PaystackCheckoutProps) {
  useEffect(() => {
    // Load Paystack script if not already loaded
    if (!document.querySelector("#paystack-js")) {
      const script = document.createElement("script");
      script.id = "paystack-js";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const payWithPaystack = () => {
    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, // put in your .env file
      email,
      amount: amount * 100, // convert to Kobo
      ref: `${orderId}_${Date.now()}`,
      callback: (response: { reference: string }) => {
        onSuccess(response.reference);
      },
      onClose,
    });

    handler.openIframe();
  };

  return (
    <button onClick={payWithPaystack} className="btn btn-primary w-full">
      Pay ₦{amount.toLocaleString()}
    </button>
  );
}
