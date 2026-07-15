import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, History } from "lucide-react";

import { fetchMaterials } from "@/lib/materialsService";
import { fetchOrders } from "@/lib/ordersService";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaterialCard } from "@/components/MaterialCard";
import QuantityControl from "@/components/QuantityControl";
import OrderHistory from "@/components/orderHistory";
import {
  normalizeOrder,
  readMaterialOrderState,
  writeMaterialOrderState,
} from "@/lib/materialOrderStorage";

import type { Material, OrderItem, Order, OrderItemType } from "@/types";

export default function Ind() {
  const navigate = useNavigate();
  const [materialsLoaded, setMaterialsLoaded] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  /* ================= FETCH MATERIALS ================= */
  const { data: materials = [], isLoading, isError } = useQuery({
    queryKey: ["materials"],
    queryFn: fetchMaterials,
  });

  /* ================= RESTORE STATE ================= */
  useEffect(() => {
    const savedState = readMaterialOrderState();
    setCart(savedState.cart ?? []);
    setSelectedMaterial((savedState.selectedMaterial as Material | null) ?? null);
    setQuantity(savedState.quantity ?? 1);
    setOrder(savedState.order ?? null);

    setMaterialsLoaded(true);
  }, [navigate]);

  /* ================= PERSIST STATE ================= */
  useEffect(() => {
    if (!materialsLoaded) return;

    writeMaterialOrderState({ cart, selectedMaterial, quantity, order });
  }, [cart, selectedMaterial, quantity, order, materialsLoaded]);

  /* ================= RESTORE COMPLETED ORDER ================= */
  useEffect(() => {
    const checkLatestOrder = async () => {
      try {
        const orders = await fetchOrders();
        if (!orders?.length) return;

        const latestOrder = normalizeOrder(orders[0]);
        if (latestOrder?.payment_status === "completed") {
          writeMaterialOrderState({ order: latestOrder });
          navigate("/tracking");
        }
      } catch {
        /* silent */
      }
    };

    checkLatestOrder();
  }, []);

  /* ================= ADD TO CART ================= */
  const addToCart = () => {
    if (!selectedMaterial) return;

    const item: OrderItem = {
      id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      order_id: "",
      material_id: selectedMaterial.id,
      item_type: "material" as OrderItemType,
      quantity,
      unit_price: Number(selectedMaterial.unit_price),
      total_price: Number(selectedMaterial.unit_price) * quantity,
      created_at: new Date().toISOString(),
      material: selectedMaterial,
    };

    const updatedCart = [...cart, item];
    setCart(updatedCart);

    writeMaterialOrderState({ cart: updatedCart, selectedMaterial: null, quantity: 1 });

    setSelectedMaterial(null);
    setQuantity(1);

    navigate("/cart");
  };

  /* ================= RENDER ================= */
  return (
    <div className="max-w-6xl mx-auto px-6 pb-10 pt-32 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package /> Order Materials
        </h1>

        <Button variant="ghost" onClick={() => setShowHistory(true)}>
          <History className="w-4 h-4 mr-2" />
          Order History
        </Button>
      </div>

      {/* STATES */}
      {isLoading && <p className="text-center">Loading materials…</p>}
      {isError && <p className="text-center text-red-600">Failed to load materials</p>}

      {/* MATERIALS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            selected={selectedMaterial?.id === material.id}
            onClick={() => setSelectedMaterial(material)}
          />
        ))}
      </div>

      {/* SELECTED MATERIAL */}
      {selectedMaterial && (
        <Card className="p-6 space-y-4 border-2 border-primary/30">
          <h3 className="text-lg font-semibold">
            {selectedMaterial.name} — ₦
            {Number(selectedMaterial.unit_price).toLocaleString("en-NG")}
          </h3>

          <QuantityControl
            quantity={quantity}
            onQuantityChange={setQuantity}
            unit="pack"
          />

          <Button size="lg" className="w-full" onClick={addToCart}>
            Add to Cart
          </Button>
        </Card>
      )}

      {/* ORDER HISTORY */}
      <OrderHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onViewOrder={(o) => {
          const normalized = normalizeOrder(o);
          if (normalized) {
            writeMaterialOrderState({ order: normalized });
          }
          navigate(`/order/${o.id}`);
        }}
      />
    </div>
  );
}
