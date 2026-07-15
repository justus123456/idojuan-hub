import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import CartSummary from "@/components/CartSummary";
import { useToast } from "@/hooks/use-toast";
import { readMaterialOrderState, writeMaterialOrderState } from "@/lib/materialOrderStorage";

import type { OrderItem } from "@/types";

const FORCE_DETAILS_KEY = "material_force_details";

export default function CartPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const savedState = readMaterialOrderState();
    setCart(Array.isArray(savedState.cart) ? savedState.cart : []);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    writeMaterialOrderState({ cart });
  }, [cart, restored]);

  if (!cart.length) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-28 text-center space-y-4">
        <p className="text-lg">Your cart is empty.</p>

        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Materials
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pt-28 space-y-6">
      <h1 className="text-2xl font-bold">Your Cart</h1>

      <CartSummary
        items={cart}
        onRemove={(id) =>
          setCart((prev) =>
            prev.filter((item) => item.id !== id)
          )
        }
        onClear={() => {
          setCart([]);
          toast({ title: "Cart cleared" });
        }}
        onCheckout={() => {
          localStorage.setItem(FORCE_DETAILS_KEY, "1");
          navigate("/payment");
        }}
      />

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
