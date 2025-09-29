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
        "p-4 cursor-pointer transition-all duration-300 hover:shadow-lg border-2",
        "bg-gradient-to-br from-card to-muted/20",
        selected 
          ? "border-primary shadow-lg transform -translate-y-1" 
          : "border-border hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="text-center space-y-3">
        <div className="text-3xl">{material.icon}</div>
        <h3 className="font-semibold text-foreground">{material.name}</h3>
        <div className="text-lg font-bold text-construction-orange">
          {formatPrice(material.price)}
        </div>
      </div>
    </Card>
  );
};