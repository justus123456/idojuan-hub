export interface Material {
  id: number;
  name: string;
  price: number;
  unit: string;
  icon: string;
}

export interface OrderItem {
  id: string;
  material: Material;
  quality: 'standard' | 'premium';
  qualityMultiplier: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BuyerInfo {
  email: string;
  phone: string;
  name: string;
  address: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'on_move' | 'at_area' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  buyerInfo: BuyerInfo;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  estimatedDelivery: Date;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}