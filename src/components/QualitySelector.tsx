// src/components/QualitySelector.tsx
import { Card } from "@/components/ui/card";

interface QualitySelectorProps {
  selectedQuality: "normal" | "premium";
  onQualityChange: (quality: "normal" | "premium", multiplier: number) => void;
}

export const QualitySelector = ({
  selectedQuality,
  onQualityChange,
}: QualitySelectorProps) => {
  const qualities = [
    {
      id: "normal",
      name: "Normal Quality",
      description: "Standard material suitable for most projects.",
      multiplier: 1.0,
    },
    {
      id: "premium",
      name: "Premium Quality",
      description: "Higher-grade materials for stronger durability.",
      multiplier: 1.5,
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Select Material Quality
      </label>

      <div className="grid grid-cols-2 gap-4">
        {qualities.map((quality) => {
          const isSelected = selectedQuality === quality.id;

          return (
            <Card
              key={quality.id}
              onClick={() => onQualityChange(quality.id as "normal" | "premium", quality.multiplier)}
              className={`p-4 cursor-pointer rounded-2xl border-2 transition-transform duration-300 transform hover:-translate-y-1 hover:shadow-lg
                ${isSelected 
                  ? "border-blue-500 bg-blue-50 shadow-inner scale-105" 
                  : "border-gray-300 bg-white hover:border-blue-300"}`}
            >
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <div className="font-semibold text-sm text-gray-800">{quality.name}</div>
                <div className="text-xs text-gray-500">{quality.description}</div>
                <div className="text-xs font-medium text-blue-600">
                  Price Multiplier: ×{quality.multiplier.toFixed(1)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QualitySelector;
