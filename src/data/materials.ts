import { Material } from '@/types';

export const materials: Material[] = [
  { id: 1, name: "Cement", price: 3500, unit: "bag", icon: "📦" },
  { id: 2, name: "Sand", price: 20000, unit: "ton", icon: "🏔️" },
  { id: 3, name: "Gravel", price: 25000, unit: "ton", icon: "💎" },
  { id: 4, name: "Bricks", price: 150, unit: "piece", icon: "🧱" },
  { id: 5, name: "Steel Rebar", price: 4500, unit: "meter", icon: "🔩" },
  { id: 6, name: "Concrete Mix", price: 50000, unit: "cubic yard", icon: "🌪️" },
  { id: 7, name: "Roofing Sheets", price: 3500, unit: "sheet", icon: "🏠" },
  { id: 8, name: "Paint", price: 8500, unit: "gallon", icon: "🎨" },
  { id: 9, name: "Nails", price: 250, unit: "kg", icon: "📌" },
  { id: 10, name: "Electrical Wires", price: 1200, unit: "meter", icon: "🔌" },
];

export const qualityOptions = [
  {
    id: 'standard',
    name: 'Standard',
    multiplier: 1,
    description: 'Basic quality materials',
    badge: 'Base Price'
  },
  {
    id: 'premium',
    name: 'Premium', 
    multiplier: 1.3,
    description: 'Enhanced durability & quality',
    badge: '+30%'
  }
] as const;