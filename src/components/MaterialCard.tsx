import type { Material } from '@/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MaterialCardProps {
  material: Material;
  selected: boolean;
  onClick: () => void;
}

export const MaterialCard = ({ material, selected, onClick }: MaterialCardProps) => {
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG')}/${material.unit}`;
  };

  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer transition-all duration-300 border-2",
        "bg-gradient-to-br from-card to-muted/20",
        selected 
          ? "border-primary shadow-lg transform -translate-y-1" 
          : "border-border hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="text-center space-y-3">
        {material.image ? (
          <img src={material.image} alt={material.name} className="mx-auto h-16 w-16 object-contain" />
        ) : (
          <div className="text-3xl">{material.icon || '🧱'}</div> // fallback icon
        )}
        <h3 className="font-semibold text-foreground">{material.name}</h3>
        <div className="text-lg font-bold text-construction-orange">
          {formatPrice(material.unit_price)}
        </div>
      </div>
    </Card>
  );
};
