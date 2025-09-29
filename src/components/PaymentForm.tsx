import { PaystackButton } from 'react-paystack';
import type { BuyerInfo } from '@/types';

interface PaymentFormProps {
  buyer: BuyerInfo;
  amount: number; // amount in Naira
  onSuccess: (reference: any) => void;
  onClose: () => void;
}

export const PaymentForm = ({ buyer, amount, onSuccess, onClose }: PaymentFormProps) => {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY; // set in .env file

  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: buyer.email,
    amount: amount * 100, // Paystack expects kobo (Naira × 100)
    publicKey,
    metadata: {
      custom_fields: [
        {
          display_name: buyer.name,
          variable_name: 'phone',
          value: buyer.phone,
        },
        {
          display_name: 'Delivery Address',
          variable_name: 'address',
          value: buyer.address,
        }
      ]
    }
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Pay ₦{amount.toLocaleString()}</h2>
      <PaystackButton 
        {...paystackConfig}
        text="Proceed with Paystack"
        onSuccess={onSuccess}
        onClose={onClose}
        className="btn btn-primary w-full"
      />
    </div>
  );
};
