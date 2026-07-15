// src/components/QuantityControl.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  unit: string;
  onAdd?: () => void; // Optional Add button action
}

const QuantityControl = ({ quantity, onQuantityChange, unit, onAdd }: QuantityControlProps) => {
  const [inputValue, setInputValue] = useState(quantity.toString());

  // Sync input with external quantity
  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleDecrease = () => {
    if (quantity > 1) onQuantityChange(quantity - 1);
  };

  const handleIncrease = () => onQuantityChange(quantity + 1);

  const handleManualChange = (value: string) => {
    setInputValue(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1) onQuantityChange(parsed);
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      setInputValue("1");
      onQuantityChange(1);
    }
  };

  return (
    <div className="space-y-5 max-w-md mx-auto">
      {/* Label */}
      <label className="block text-sm font-semibold text-foreground">Quantity Needed</label>

      {/* Increment / Decrement */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={handleDecrease}
          disabled={quantity <= 1}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 disabled:bg-red-200 disabled:text-red-400 transition-all duration-200"
          aria-label="Decrease quantity"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div className="min-w-[60px] text-center text-lg font-bold text-foreground">
          {quantity}
        </div>

        <Button
          onClick={handleIncrease}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-200"
          aria-label="Increase quantity"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Manual Input */}
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <span>Or enter manually:</span>
        <Input
          type="number"
          min={1}
          value={inputValue}
          onChange={(e) => handleManualChange(e.target.value)}
          onBlur={handleBlur}
          className="w-20 text-center rounded-md border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
        />
        <span>
          {unit}
          {quantity > 1 ? "s" : ""}
        </span>
      </div>

      {/* Add Button */}
      {onAdd && (
        <Button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-construction-orange text-white font-semibold hover:opacity-90 active:scale-95 transition-all duration-300"
        >
          <Plus className="h-5 w-5" /> Add to Order
        </Button>
      )}
    </div>
  );
};

export default QuantityControl;
