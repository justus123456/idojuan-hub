// src/components/PaystackCheckout.tsx
import { usePaystackPayment } from "react-paystack";

interface PaystackCheckoutProps {
  email: string;
  amount: number; // amount in Naira
  orderId: string;
  onSuccess: (reference: { reference: string }) => void;
  onClose: () => void;
}

export default function PaystackCheckout({
  email,
  amount,
  orderId,
  onSuccess,
  onClose,
}: PaystackCheckoutProps) {
  const initializePayment = usePaystackPayment({
    email,
    amount: amount * 100, // convert Naira → Kobo
    reference: orderId,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY!,
  });

  return (
    <button
      className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
      onClick={() =>
        initializePayment({
          onSuccess,
          onClose,
        })
      }
    >
      Pay with Paystack
    </button>
  );
}
