// src/components/MaterialCard.tsx
import type { Material } from "@/types";
import { Card } from "@/components/ui/card";

interface MaterialCardProps {
  material: Material;
  selected: boolean;
  onClick: (material: Material) => void;
}

/**
 * MaterialCard
 * Displays a single construction material with image uploaded by admin, name, category, and unit price.
 * Highlights when selected and is accessible via keyboard.
 */
export const MaterialCard = ({ material, selected, onClick }: MaterialCardProps) => {
  const { name = "Unnamed Material", image, category, unit_price, unit } = material;

  const formatPrice = (price?: number | null) => {
    if (price == null || isNaN(price)) return "Price Unavailable";
    return `₦${price.toLocaleString("en-NG")}${unit ? `/${unit}` : ""}`;
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onClick(material)}
      onKeyDown={(e) => e.key === "Enter" && onClick(material)}
      className={`p-4 cursor-pointer select-none rounded-2xl border-2 transition-all duration-300 flex flex-col items-center space-y-3 text-center
        ${selected 
          ? "border-blue-500 bg-blue-50 shadow-lg scale-105 transform -translate-y-1" 
          : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md hover:scale-102"}`}
    >
      {/* Material Image uploaded by admin */}
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-20 w-20 object-contain rounded-md mx-auto"
          loading="lazy"
        />
      ) : (
        <div className="text-5xl text-blue-600" aria-label="Material Icon">
          🧱
        </div>
      )}

      {/* Material Name */}
      <h3 className="font-semibold text-base text-gray-800 line-clamp-1">{name}</h3>

      {/* Category */}
      {category && <p className="text-sm text-gray-500 line-clamp-1">{category}</p>}

      {/* Price per bulk unit */}
      <div className="text-lg font-bold text-orange-600">{formatPrice(unit_price)}</div>
    </Card>
  );
};

export default MaterialCard;
