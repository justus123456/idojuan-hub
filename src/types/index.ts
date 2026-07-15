// ==================================================
// MATERIAL
// ==================================================
export interface Material {
  id: string;
  name: string;

  image?: string | null;
  icon?: string | null;
  category?: string | null;
  description?: string | null;

  unit?: string | null;
  unit_price: number; // required (pricing source of truth)
}

// ==================================================
// ORDER ITEM
// ==================================================
export type OrderItemType = "material" | "property";

export interface OrderItem {
  id: string;
  order_id: string;

  // Polymorphic reference
  item_type: OrderItemType;
  material_id?: string | null;
  property_id?: string | null;

  quantity: number;
  unit_price: number;
  total_price: number;

  created_at: string;

  // Relations (Supabase joins)
  material?: Material | null;
  property?: any | null; // optional future relation if properties table exists
}

// ==================================================
// BUYER INFO (FORM ONLY — NOT DB MODEL)
// ==================================================
export interface BuyerInfo {
  name: string;
  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;

  notes?: string;
}

// ==================================================
// STATUS ENUMS (MUST MATCH SUPABASE ENUMS)
// ==================================================
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "on_move"
  | "at_area"
  | "delivered"
  | "cancelled";

// ==================================================
// ORDER (DATABASE MODEL)
// ==================================================
export interface Order {
  id: string;
  order_number: string;

  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;

  delivery_address: string;
  delivery_city: string;
  delivery_state: string;

  // Pricing (DB is source of truth)
  total_amount: number;
  transport_cost: number;
  service_charge: number;

  payment_status: PaymentStatus;
  order_status: OrderStatus;
   order_items: OrderItem[];
  paystack_reference?: string | null;
  notes?: string | null;

  created_at: string;
  updated_at: string;

  
  // Relations
  items?: OrderItem[];
}

// ==================================================
// ORDER TRACKING (ADMIN → USER HISTORY)
// ==================================================
export interface OrderTrackingEvent {
  id: string;
  order_id: string;

  status: string; // timeline step key (e.g., 'received', 'confirmed', etc.)
  message?: string | null;

  step_order?: number; // optional: ordering field for timeline
  is_completed?: boolean; // optional: frontend can determine completion

  created_at: string;
}

// ==================================================
// UI EXTENSIONS (FRONTEND ONLY)
// ==================================================
export interface OrderWithTracking extends Order {
  tracking?: OrderTrackingEvent[];
  estimated_delivery?: string;
}

// ==================================================
// CART / SUMMARY (UI ONLY)
// ==================================================
export interface OrderSummaryProps {
  items: OrderItem[];
  onClear: () => void;
  onCheckout: () => void;
}
