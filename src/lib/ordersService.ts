import { createClient } from "@supabase/supabase-js";
import type { BuyerInfo, Order } from "@/types";

/* =====================================================
   Supabase Client
===================================================== */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =====================================================
   ENUMS — MUST MATCH DATABASE EXACTLY
===================================================== */
export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type OrderStatusEnum =
  (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export type PaymentStatusEnum =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/* =====================================================
   Types
===================================================== */
export type OrderItemType = "material" | "property";

export interface OrderItem {
  material_id: string;
  item_type: OrderItemType;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateOrderPayload {
  cart: OrderItem[];
  customer: BuyerInfo;
  transportCost: number;
  serviceCharge: number;
  totalAmount: number;
  notes?: string;
}

/* =====================================================
   Utils
===================================================== */
export const generateOrderNumber = () =>
  `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

/* =====================================================
   Create Order
===================================================== */
export const createOrder = async (
  payload: CreateOrderPayload
): Promise<Order> => {
  const { data: authData } = await supabase.auth.getUser();
  const customerId = authData?.user?.id ?? null;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      customer_id: customerId,

      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone,
      delivery_address: payload.customer.address,
      delivery_city: payload.customer.city || "N/A",
      delivery_state: payload.customer.state || "N/A",

      total_amount: payload.totalAmount,
      transport_cost: payload.transportCost,
      service_charge: payload.serviceCharge,

      payment_status: PAYMENT_STATUS.PENDING,
      order_status: ORDER_STATUS.PENDING,

      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? "Failed to create order");
  }

  /* ---------------- Order Items ---------------- */
  if (payload.cart.length) {
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(
        payload.cart.map((item) => ({
          order_id: order.id,
          material_id: item.material_id,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
      );

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }
  }

  /* ---------------- Status History ---------------- */
  await supabase.from("order_status_history").insert({
    order_id: order.id,
    status: ORDER_STATUS.PENDING,
    message: "Order placed by customer",
  });

  return order as Order;
};

/* =====================================================
   Mark Order as Paid
===================================================== */
export const markOrderAsPaid = async (
  orderId: string,
  reference?: string
): Promise<void> => {
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: PAYMENT_STATUS.COMPLETED,
      order_status: ORDER_STATUS.PROCESSING,
      paystack_reference: reference ?? null,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status: ORDER_STATUS.PROCESSING,
    message: "Payment confirmed",
  });
};

/* =====================================================
   Update Order Status (Admin)
===================================================== */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatusEnum,
  message?: string
): Promise<void> => {
  const { error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status,
    message: message ?? `Order status changed to ${status}`,
  });
};

/* =====================================================
   Fetch Orders
===================================================== */
export const fetchOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(*, material:materials(*)),
      status_history:order_status_history(*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Order[];
};

/* =====================================================
   Fetch Single Order
===================================================== */
export const fetchOrderById = async (
  orderId: string
): Promise<Order | null> => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(*, material:materials(*)),
      status_history:order_status_history(*)
    `)
    .eq("id", orderId)
    .single();

  if (error) throw new Error(error.message);
  return data as Order;
};

/* =====================================================
   Update Order Details (Buyer Info)
===================================================== */
export const updateOrderDetails = async (
  orderId: string,
  customer: BuyerInfo
): Promise<Order> => {
  const { data, error } = await supabase
    .from("orders")
    .update({
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      delivery_address: customer.address,
      delivery_city: customer.city || "N/A",
      delivery_state: customer.state || "N/A",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update order details");
  }

  return data as Order;
};
