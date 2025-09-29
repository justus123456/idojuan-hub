import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { qualityOptions } from '@/data/materials';

interface QualitySelectorProps {
  selectedQuality: string;
  onQualityChange: (quality: string, multiplier: number) => void;
}

export const QualitySelector = ({ selectedQuality, onQualityChange }: QualitySelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Quality Level</label>
      <div className="grid grid-cols-2 gap-3">
        {qualityOptions.map((option) => (
          <Card
            key={option.id}
            className={cn(
              "p-3 cursor-pointer transition-all duration-200 border-2",
              selectedQuality === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onQualityChange(option.id, option.multiplier)}
          >
            <div className="text-center space-y-1">
              <div className="font-semibold text-sm">{option.name}</div>
              <div className="text-xs text-secondary font-medium">{option.badge}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};