// src/components/BuyerInfoForm.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import type { BuyerInfo } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface BuyerInfoFormProps {
  totalCost: number;      // Total price of selected materials
  transportCost: number;  // Fixed transport fee
  serviceCharge: number;  // Calculated service charge
  onSubmit: (info: BuyerInfo) => void;
  onBack: () => void;
}

export const BuyerInfoForm = ({
  totalCost,
  transportCost,
  serviceCharge,
  onSubmit,
  onBack,
}: BuyerInfoFormProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<BuyerInfo>(() => {
    // Restore from localStorage to prevent reset on reload
    const saved = localStorage.getItem("buyerInfo");
    return saved
      ? JSON.parse(saved)
      : { name: "", email: "", phone: "", address: "", city: "", state: "", notes: "" };
  });

  const [errors, setErrors] = useState<Partial<BuyerInfo>>({});
  const [loading, setLoading] = useState(false);

  const totalAmount = totalCost + serviceCharge + transportCost;

  // Persist form data on change
  useEffect(() => {
    localStorage.setItem("buyerInfo", JSON.stringify(formData));
  }, [formData]);

  const validateForm = () => {
    const newErrors: Partial<BuyerInfo> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Enter a valid email";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Delivery address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof BuyerInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Form Error", description: "Please fix the errors", variant: "destructive", className: "mt-20" });
      return;
    }
    setLoading(true);
    onSubmit(formData);
    setLoading(false);
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto shadow-lg rounded-xl mt-16">
      <h2 className="text-2xl font-bold mb-2">Delivery Details</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Fill in your details to complete your order and payment.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          id="name"
          label="Full Name"
          icon={<User className="h-4 w-4 text-muted-foreground" />}
          value={formData.name}
          onChange={(val) => handleChange("name", val)}
          error={errors.name}
          placeholder="Enter your full name"
        />
        <InputField
          id="email"
          label="Email"
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
          value={formData.email}
          onChange={(val) => handleChange("email", val)}
          error={errors.email}
          placeholder="Enter your email"
        />
        <InputField
          id="phone"
          label="Phone"
          icon={<Phone className="h-4 w-4 text-muted-foreground" />}
          value={formData.phone}
          onChange={(val) => handleChange("phone", val)}
          error={errors.phone}
          placeholder="Enter your phone number"
        />
        <TextareaField
          id="address"
          label="Delivery Address"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          value={formData.address}
          onChange={(val) => handleChange("address", val)}
          error={errors.address}
          rows={2}
          placeholder="Enter delivery address"
        />
        <InputField
          id="city"
          label="City"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          value={formData.city}
          onChange={(val) => handleChange("city", val)}
          error={errors.city}
          placeholder="Enter your city"
        />
        <InputField
          id="state"
          label="State"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          value={formData.state}
          onChange={(val) => handleChange("state", val)}
          error={errors.state}
          placeholder="Enter your state"
        />
        <TextareaField
          id="notes"
          label="Delivery Notes"
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          value={formData.notes || ""}
          onChange={(val) => handleChange("notes", val)}
          placeholder="Any extra instructions (optional)"
          rows={2}
        />

        <div className="border-t border-border pt-4 mt-4 text-sm">
          <p>Materials: ₦{totalCost.toLocaleString("en-NG")}</p>
          <p>Service Charge (10%): ₦{serviceCharge.toLocaleString("en-NG")}</p>
          <p>Transport: ₦{transportCost.toLocaleString("en-NG")}</p>
          <p className="text-lg font-bold mt-2">Total: ₦{totalAmount.toLocaleString("en-NG")}</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            Back to Order
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Processing..." : "Continue to Payment"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

// --------- Helper Components ----------
interface InputFieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}
const InputField = ({ id, label, icon, value, onChange, error, placeholder }: InputFieldProps) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">{icon} {label}</Label>
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border rounded-md ${error ? "border-destructive" : "border-border"}`}
    />
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
);

interface TextareaFieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  placeholder?: string;
}
const TextareaField = ({ id, label, icon, value, onChange, error, rows = 3, placeholder }: TextareaFieldProps) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">{icon} {label}</Label>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`border rounded-md ${error ? "border-destructive" : "border-border"}`}
    />
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
);
