// src/components/PaymentForm.tsx
import { useEffect, useState } from "react";
import { User, Mail, Phone, XCircle, ShieldCheck } from "lucide-react";
import PaystackCheckout from "@/components/PaystackCheckout";
import type { BuyerInfo, Order, OrderItem } from "@/types";
import { Button } from "@/components/ui/button";

interface PaymentFormProps {
  buyer: BuyerInfo;
  orderId: string;
  order: Order;
  onSuccess: (ref: { reference: string }) => void;
  onClose: () => void;
  onBack?: () => void;
}

const formatPrice = (value: number) =>
  `₦${Number(value).toLocaleString("en-NG")}`;

export default function PaymentForm({
  buyer,
  orderId,
  order,
  onSuccess,
  onClose,
  onBack,
}: PaymentFormProps) {
  // Persist order state to localStorage
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

  useEffect(() => {
    const savedOrder = localStorage.getItem(`order_${orderId}`);
    if (savedOrder) setCurrentOrder(JSON.parse(savedOrder));
  }, [orderId]);

  useEffect(() => {
    localStorage.setItem(`order_${orderId}`, JSON.stringify(currentOrder));
  }, [currentOrder, orderId]);

  /* =====================================================
     FIXED COST CALCULATIONS (NO ₦0 BUG)
  ===================================================== */
  const materialCost =
    currentOrder.items?.reduce((sum: number, item: OrderItem) => {
      return sum + Number(item.quantity) * Number(item.unit_price);
    }, 0) ?? 0;

  const transportCost = Number(currentOrder.transport_cost ?? 0);
  const serviceCharge =
    Number(currentOrder.service_charge ?? Math.round(materialCost * 0.1));

  const totalAmount = materialCost + transportCost + serviceCharge;

  return (
    <div className="max-w-lg mx-auto pt-24 px-4">
      {/* CARD */}
      <div className="bg-white border rounded-2xl shadow-xl p-6 space-y-6">
        {/* HEADER */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">Secure Checkout</h2>
          <p className="text-sm text-gray-500">
            Review your order and complete payment
          </p>
        </div>

        {/* BUYER INFO */}
        <div className="rounded-xl p-4 space-y-2 text-sm bg-gray-100">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{buyer.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{buyer.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>{buyer.phone}</span>
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="border rounded-xl p-4 space-y-3 text-sm bg-white">
          <h3 className="font-semibold text-base">Order Summary</h3>

          {currentOrder.items?.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.material?.name} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(item.quantity * item.unit_price)}
              </span>
            </div>
          ))}

          <div className="border-t pt-3 space-y-1 text-gray-700">
            <div className="flex justify-between">
              <span>Materials</span>
              <span>{formatPrice(materialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport</span>
              <span>{formatPrice(transportCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service charge</span>
              <span>{formatPrice(serviceCharge)}</span>
            </div>

            <div className="flex justify-between font-bold text-gray-900 pt-2">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* PAYSTACK */}
        <div className="space-y-3">
          <PaystackCheckout
            email={buyer.email}
            amount={totalAmount}
            orderId={orderId}
            order={currentOrder}
            onSuccess={onSuccess}
            onClose={onClose}
           
          />

          <p className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            Secured by Paystack
          </p>
        </div>

        {/* ACTIONS */}
        <div className="space-y-2">
          {onBack && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onBack}
            >
              ← Modify Order
            </Button>
          )}

          <Button
            variant="destructive"
            className="w-full"
            onClick={onClose}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
