// src/components/CartSummary.tsx
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import type { OrderItem } from "@/types";

interface CartSummaryProps {
  items: OrderItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

const SERVICE_CHARGE_PERCENT = 0.1;
const TRANSPORT_COST = 10_000;

export default function CartSummary({
  items,
  onRemove,
  onClear,
  onCheckout,
}: CartSummaryProps) {
  const formatPrice = (value = 0) =>
    `₦${Number(value).toLocaleString("en-NG")}`;

  // ---------------- Derived Totals ----------------
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (item.total_price ?? item.unit_price * item.quantity),
        0
      ),
    [items]
  );

  const serviceCharge = useMemo(
    () => Math.round(subtotal * SERVICE_CHARGE_PERCENT),
    [subtotal]
  );

  const totalAmount = useMemo(
    () => subtotal + serviceCharge + TRANSPORT_COST,
    [subtotal, serviceCharge]
  );

  return (
    <Card className="w-full max-w-md mx-auto mt-24 p-6 rounded-xl border bg-white text-black shadow-md space-y-4">
      <h2 className="text-xl font-semibold">Order Summary</h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">
          Your cart is empty. Add materials to continue.
        </p>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-gray-100 p-2 rounded-md"
              >
                <div className="truncate">
                  <p className="font-medium truncate">
                    {item.material?.name ?? item.item_type}
                  </p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} × ₦{item.unit_price.toLocaleString("en-NG")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatPrice(item.total_price)}</span>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 border-t space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge (10%)</span>
              <span>{formatPrice(serviceCharge)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport</span>
              <span>{formatPrice(TRANSPORT_COST)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={onClear}
            >
              Clear Cart
            </Button>

            <Button
              className="flex-1 bg-primary text-white hover:bg-primary/90"
              onClick={onCheckout}
            >
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
