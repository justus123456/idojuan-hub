import PaystackCheckout from "@/components/PaystackCheckout";
import type { BuyerInfo } from "@/types";

interface PaymentFormProps {
  buyer: BuyerInfo;
  amount: number;
  orderId: string;
  onSuccess: (reference: { reference: string }) => void;
  onClose: () => void;
}

export const PaymentForm = ({
  buyer,
  amount,
  orderId,
  onSuccess,
  onClose,
}: PaymentFormProps) => {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">
        Pay ₦{amount.toLocaleString()}
      </h2>

      <PaystackCheckout
        email={buyer.email}
        amount={amount}
        orderId={orderId}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    </div>
  );
};
