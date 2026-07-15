import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import QuantityControl from "@/components/QuantityControl";
import { useToast } from "@/hooks/use-toast";
import { fetchMaterials } from "@/lib/materialsService";

import type { Material, OrderItem, OrderItemType } from "@/types";

const CART_KEY = "material_cart";

export default function DetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [material, setMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  /* ---------------- Load material ---------------- */
  useEffect(() => {
    if (!id) return;

    const loadMaterial = async () => {
      try {
        const materials = await fetchMaterials();
        const found = materials.find((m) => m.id === id);

        if (!found) {
          toast({
            title: "Material not found",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setMaterial(found);
      } catch {
        toast({
          title: "Failed to load material",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [id, navigate, toast]);

  /* ---------------- Add to cart ---------------- */
  const addToCart = () => {
    if (!material) return;

    let cart: OrderItem[] = [];

    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try {
        cart = JSON.parse(saved);
      } catch {
        localStorage.removeItem(CART_KEY);
      }
    }

    const item: OrderItem = {
      id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      order_id: "",
      material_id: material.id,
      item_type: "material" as OrderItemType,
      quantity,
      unit_price: Number(material.unit_price),
      total_price: Number(material.unit_price) * quantity,
      created_at: new Date().toISOString(),
      material,
    };

    const updatedCart = [...cart, item];
    localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));

    toast({ title: "Added to cart" });
    navigate("/cart");
  };

  /* ---------------- States ---------------- */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 pt-28 text-center">
        Loading material details…
      </div>
    );
  }

  if (!material) return null;

  /* ---------------- Render ---------------- */
  return (
    <div className="max-w-3xl mx-auto px-6 pt-28 space-y-6">
      <h1 className="text-3xl font-bold">{material.name}</h1>

      <p className="text-lg font-semibold">
        ₦{Number(material.unit_price).toLocaleString("en-NG")}
      </p>

      <p className="text-gray-600">
        {material.description || "No description available."}
      </p>

      <QuantityControl
        quantity={quantity}
        onQuantityChange={setQuantity}
        unit="pack"
      />

      <Button size="lg" className="w-full" onClick={addToCart}>
        Add to Cart
      </Button>
    </div>
  );
}
