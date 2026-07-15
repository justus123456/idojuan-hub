import type { BuyerInfo, Order, OrderItem } from "@/types";

export const CART_KEY = "material_cart";
export const STATE_KEY = "material_order_state";
export const ACTIVE_ORDER_KEY = "active_order";
export const BUYER_INFO_KEY = "buyerInfo";
export const CURRENT_ORDER_KEY = "currentOrder";
export const LAST_ORDER_KEY = "last_order";
export const ROUTE_KEY = "material_order_route";
export const ORDER_HISTORY_KEY = "order_history";

export interface MaterialOrderState {
  selectedMaterial?: unknown | null;
  quantity?: number;
  cart?: OrderItem[];
  buyerInfo?: BuyerInfo | null;
  order?: Order | null;
}

export function normalizeOrder(order: Order | null | undefined): Order | null {
  if (!order) return null;

  const orderItems = Array.isArray(order.order_items)
    ? order.order_items
    : Array.isArray(order.items)
      ? order.items
      : [];

  const materialTotal = orderItems.reduce(
    (sum, item) =>
      sum + Number(item.total_price ?? Number(item.unit_price ?? 0) * Number(item.quantity ?? 0)),
    0
  );

  return {
    ...order,
    order_items: orderItems,
    items: orderItems,
    transport_cost: Number(order.transport_cost ?? 0),
    service_charge: Number(order.service_charge ?? 0),
    total_amount: Number(order.total_amount ?? materialTotal),
  };
}

export function readMaterialOrderState(): MaterialOrderState {
  const rawState = localStorage.getItem(STATE_KEY);
  const rawBuyerInfo = localStorage.getItem(BUYER_INFO_KEY);
  const rawActiveOrder =
    localStorage.getItem(ACTIVE_ORDER_KEY) ||
    localStorage.getItem(CURRENT_ORDER_KEY) ||
    localStorage.getItem(LAST_ORDER_KEY);
  const rawCart = localStorage.getItem(CART_KEY);

  let parsedState: MaterialOrderState = {};
  let parsedBuyerInfo: BuyerInfo | null = null;
  let parsedOrder: Order | null = null;
  let parsedCart: OrderItem[] = [];

  if (rawState) {
    try {
      parsedState = JSON.parse(rawState) as MaterialOrderState;
    } catch {
      localStorage.removeItem(STATE_KEY);
    }
  }

  if (rawBuyerInfo) {
    try {
      parsedBuyerInfo = JSON.parse(rawBuyerInfo) as BuyerInfo;
    } catch {
      localStorage.removeItem(BUYER_INFO_KEY);
    }
  }

  if (rawActiveOrder) {
    try {
      parsedOrder = normalizeOrder(JSON.parse(rawActiveOrder) as Order);
    } catch {
      localStorage.removeItem(ACTIVE_ORDER_KEY);
      localStorage.removeItem(CURRENT_ORDER_KEY);
      localStorage.removeItem(LAST_ORDER_KEY);
    }
  }

  if (rawCart) {
    try {
      parsedCart = JSON.parse(rawCart) as OrderItem[];
    } catch {
      localStorage.removeItem(CART_KEY);
    }
  }

  return {
    ...parsedState,
    cart: Array.isArray(parsedState.cart) ? parsedState.cart : parsedCart,
    buyerInfo: parsedState.buyerInfo ?? parsedBuyerInfo,
    order: normalizeOrder(parsedState.order ?? parsedOrder),
  };
}

export function writeMaterialOrderState(partial: MaterialOrderState) {
  const current = readMaterialOrderState();
  const next: MaterialOrderState = {
    ...current,
    ...partial,
    order: normalizeOrder(partial.order ?? current.order),
  };

  if (next.cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(next.cart));
  }

  if (next.buyerInfo) {
    localStorage.setItem(BUYER_INFO_KEY, JSON.stringify(next.buyerInfo));
  }

  if (next.order) {
    const normalized = normalizeOrder(next.order);
    localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(normalized));
    localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(normalized));
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(normalized));
    next.order = normalized;
  }

  localStorage.setItem(STATE_KEY, JSON.stringify(next));
}

export function clearMaterialOrderRoute() {
  localStorage.removeItem(ROUTE_KEY);
}

export function clearMaterialOrderState() {
  [
    CART_KEY,
    STATE_KEY,
    ACTIVE_ORDER_KEY,
    BUYER_INFO_KEY,
    CURRENT_ORDER_KEY,
    LAST_ORDER_KEY,
    ROUTE_KEY,
  ].forEach((key) => localStorage.removeItem(key));
}

export function readOrderHistory(): Order[] {
  const raw = localStorage.getItem(ORDER_HISTORY_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed)
      ? parsed.map((order) => normalizeOrder(order) as Order).filter(Boolean)
      : [];
  } catch {
    localStorage.removeItem(ORDER_HISTORY_KEY);
    return [];
  }
}

export function addOrderToHistory(order: Order) {
  const normalized = normalizeOrder(order);
  if (!normalized) return;

  const current = readOrderHistory();
  const merged = [normalized, ...current].filter(
    (item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index
  );
  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(merged));
}
