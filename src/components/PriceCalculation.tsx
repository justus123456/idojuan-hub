import { Card } from '@/components/ui/card';
import type { Material } from '@/types';

interface PriceCalculationProps {
  material?: Material;
  quantity: number;
  qualityMultiplier: number;
  selectedQuality: string;
}

export const PriceCalculation = ({ 
  material, 
  quantity, 
  qualityMultiplier, 
  selectedQuality 
}: PriceCalculationProps) => {
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG')}`;
  };

  if (!material) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="text-center text-muted-foreground">
          Select a material to see price calculation
        </div>
      </Card>
    );
  }

  const basePrice = material.price;
  const unitPrice = basePrice * qualityMultiplier;
  const totalPrice = unitPrice * quantity;

  return (
    <Card className="p-4 space-y-3 bg-gradient-to-br from-primary/5 to-construction-orange/5 border-l-4 border-l-primary">
      <h3 className="font-semibold text-foreground">Price Calculation</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Selected Material:</span>
          <span className="font-medium">{material.name}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Base Price:</span>
          <span className="font-medium">{formatPrice(basePrice)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quality Multiplier:</span>
          <span className="font-medium">{qualityMultiplier}x ({selectedQuality})</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Unit Price:</span>
          <span className="font-medium">{formatPrice(unitPrice)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quantity:</span>
          <span className="font-medium">{quantity} {material.unit}{quantity > 1 ? 's' : ''}</span>
        </div>
        
        <div className="border-t-2 border-dashed border-primary/30 pt-2">
          <div className="flex justify-between text-lg font-bold text-primary">
            <span>Total Price:</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};