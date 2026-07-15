import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BuyerInfoForm } from "@/components/BuyerInfoForm";
import PaystackCheckout from "@/components/PaystackCheckout";
import { useToast } from "@/hooks/use-toast";
import { createOrder, updateOrderDetails } from "@/lib/ordersService";
import { addOrderToHistory, normalizeOrder, readMaterialOrderState, writeMaterialOrderState } from "@/lib/materialOrderStorage";

import type { Order, BuyerInfo, PaymentStatus, OrderStatus, OrderItem } from "@/types";

const TRANSPORT_COST = 10000;
const SERVICE_CHARGE_PERCENT = 0.1;
const FORCE_DETAILS_KEY = "material_force_details";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);

  useEffect(() => {
    const savedState = readMaterialOrderState();
    setCart(savedState.cart ?? []);
    setOrder(savedState.order ?? null);
    setBuyerInfo(savedState.buyerInfo ?? null);

    if (localStorage.getItem(FORCE_DETAILS_KEY)) {
      localStorage.removeItem(FORCE_DETAILS_KEY);
      setEditingDetails(true);
    }
  }, []);

  const activeItems = useMemo(
    () => (order?.order_items?.length ? order.order_items : cart),
    [order, cart]
  );

  const materialTotal = useMemo(
    () =>
      activeItems.reduce(
        (sum, item) => sum + Number(item.total_price ?? item.unit_price * item.quantity),
        0
      ),
    [activeItems]
  );

  const serviceCharge = Number(
    order?.service_charge ?? Math.round(materialTotal * SERVICE_CHARGE_PERCENT)
  );
  const transportCost = Number(order?.transport_cost ?? TRANSPORT_COST);
  const totalAmount = materialTotal + serviceCharge + transportCost;

  const handleBuyerInfoSubmit = async (info: BuyerInfo) => {
    if (!cart.length) {
      toast({
        title: "Cart is empty",
        description: "Add materials before continuing to checkout.",
        variant: "destructive",
      });
      navigate("/cart");
      return;
    }

    try {
      if (order) {
        const updated = await updateOrderDetails(order.id, info);
        const hydratedOrder = normalizeOrder({
          ...order,
          ...updated,
          customer_name: updated.customer_name ?? info.name,
          customer_email: updated.customer_email ?? info.email,
          customer_phone: updated.customer_phone ?? info.phone,
          delivery_address: updated.delivery_address ?? info.address,
          delivery_city: updated.delivery_city ?? info.city,
          delivery_state: updated.delivery_state ?? info.state,
        } as Order);

        setBuyerInfo(info);
        setOrder(hydratedOrder);
        setEditingDetails(false);
        writeMaterialOrderState({ cart, buyerInfo: info, order: hydratedOrder });

        toast({
          title: "Details updated",
          description: "Your delivery details have been updated.",
        });
        return;
      }

      const newOrder = await createOrder({
        cart: cart.map((item) => ({
          material_id: item.material_id!,
          item_type: "material",
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        customer: info,
        transportCost,
        serviceCharge,
        totalAmount,
        notes: info.notes ?? "",
      });

      const hydratedOrder = normalizeOrder({
        ...newOrder,
        customer_name: newOrder.customer_name ?? info.name,
        customer_email: newOrder.customer_email ?? info.email,
        customer_phone: newOrder.customer_phone ?? info.phone,
        delivery_address: newOrder.delivery_address ?? info.address,
        delivery_city: newOrder.delivery_city ?? info.city,
        delivery_state: newOrder.delivery_state ?? info.state,
        transport_cost: newOrder.transport_cost ?? transportCost,
        service_charge: newOrder.service_charge ?? serviceCharge,
        total_amount: newOrder.total_amount ?? totalAmount,
        order_items: cart,
        items: cart,
      } as Order);

      setBuyerInfo(info);
      setOrder(hydratedOrder);
      setEditingDetails(false);
      writeMaterialOrderState({ cart, buyerInfo: info, order: hydratedOrder });
      addOrderToHistory(hydratedOrder);

      toast({
        title: "Checkout ready",
        description: `Order #${hydratedOrder?.order_number} is ready for payment.`,
      });
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error?.message || "Could not create your order.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = (ref: { reference: string }) => {
    if (!order) return;

    const updatedOrder: Order = {
      ...(normalizeOrder(order) as Order),
      payment_status: "completed" as PaymentStatus,
      order_status: "confirmed" as OrderStatus,
      paystack_reference: ref.reference,
    };

    setOrder(updatedOrder);
    writeMaterialOrderState({ cart: [], buyerInfo, order: updatedOrder });
    addOrderToHistory(updatedOrder);

    toast({
      title: "Payment Successful",
      description: `Order #${updatedOrder.order_number}`,
    });

    navigate("/tracking");
  };

  if (!cart.length && !order) {
    return (
      <div className="text-center mt-10 space-y-4">
        <p>No checkout items found.</p>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => navigate("/cart")}
        >
          Back to Cart
        </button>
      </div>
    );
  }

  if (!order || !buyerInfo || editingDetails) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-20">
        <BuyerInfoForm
          totalCost={materialTotal}
          transportCost={transportCost}
          serviceCharge={serviceCharge}
          onSubmit={handleBuyerInfoSubmit}
          onBack={() => navigate("/cart")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-20">
      <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>

      <p className="mb-4">
        Order #{order.order_number} - Total: N{totalAmount.toLocaleString("en-NG")}
      </p>

      <PaystackCheckout
        email={buyerInfo.email}
        amount={totalAmount}
        orderId={order.id}
        order={order}
        onSuccess={handlePaymentSuccess}
        onClose={() => {
          setEditingDetails(true);
          writeMaterialOrderState({ cart, buyerInfo, order });
        }}
      />
    </div>
  );
}
