// src/components/PriceCalculation.tsx
import { Card } from "@/components/ui/card";
import type { Material } from "@/types";

interface PriceCalculationProps {
  material?: Material | null;
  quantity: number;
  selectedQuality: "normal" | "premium";
  qualityMultiplier?: number; // Optional override
  serviceChargeRate?: number; // default 10%
  transportFee?: number; // default 10,000
}

export const PriceCalculation = ({
  material,
  quantity,
  selectedQuality,
  qualityMultiplier,
  serviceChargeRate = 0.1, // 10%
  transportFee = 10000,
}: PriceCalculationProps) => {
  const formatPrice = (price: number) => `₦${price.toLocaleString("en-NG")}`;

  if (!material) {
    return (
      <Card className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
        <div className="text-center text-sm text-gray-500">
          Select a material to view price calculation
        </div>
      </Card>
    );
  }

  const basePrice = Number(material.unit_price ?? 0);
  const unit = material.unit ?? "unit";
  const qty = Math.max(Number(quantity ?? 0), 0);
  const multiplier = qualityMultiplier ?? (selectedQuality === "premium" ? 1.5 : 1.0);

  const unitPrice = basePrice * multiplier;
  const totalMaterialPrice = unitPrice * qty;
  const serviceCharge = totalMaterialPrice * serviceChargeRate;
  const totalAmount = totalMaterialPrice + serviceCharge + transportFee;

  return (
    <Card className="p-5 space-y-4 bg-gradient-to-br from-blue-50 to-green-50 border-l-4 border-blue-500 shadow-md rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">Price Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Material:</span>
          <span className="font-medium capitalize text-gray-900">{material.name}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Base Price:</span>
          <span className="font-medium text-gray-900">{formatPrice(basePrice)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Quality:</span>
          <span className="font-medium capitalize text-gray-900">
            {selectedQuality} ({multiplier}×)
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Unit Price:</span>
          <span className="font-medium text-blue-600">{formatPrice(unitPrice)} / {unit}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Quantity:</span>
          <span className="font-medium text-gray-900">
            {qty} {unit}{qty > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex justify-between text-sm text-gray-700 pt-2 border-t border-dashed border-gray-300">
          <span>Material Total:</span>
          <span>{formatPrice(totalMaterialPrice)}</span>
        </div>

        <div className="flex justify-between text-sm text-gray-700">
          <span>Service Charge (10%):</span>
          <span>{formatPrice(serviceCharge)}</span>
        </div>

        <div className="flex justify-between text-sm text-gray-700">
          <span>Transport Fee:</span>
          <span>{formatPrice(transportFee)}</span>
        </div>

        <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between text-lg font-bold text-green-600">
          <span>Total Amount:</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
      </div>
    </Card>
  );
};

export default PriceCalculation;
