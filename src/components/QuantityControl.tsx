import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  unit: string;
}

export const QuantityControl = ({ quantity, onQuantityChange, unit }: QuantityControlProps) => {
  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    onQuantityChange(quantity + 1);
  };

  const handleManualChange = (value: string) => {
    const num = parseInt(value);
    if (num >= 1) {
      onQuantityChange(num);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Quantity Needed</label>
      
      {/* Visual quantity controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={handleDecrease}
          disabled={quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="text-xl font-bold min-w-[50px] text-center">
          {quantity}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={handleIncrease}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Manual input */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Or enter manually:</span>
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleManualChange(e.target.value)}
          className="w-20 text-center"
        />
        <span>{unit}{quantity > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};