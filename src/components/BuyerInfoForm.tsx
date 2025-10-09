import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BuyerInfo } from '@/types';
import { User, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // Make sure this points to your Supabase client

interface BuyerInfoFormProps {
  onSubmit: (buyerInfo: BuyerInfo) => void;
  onBack: () => void;
}

export const BuyerInfoForm = ({ onSubmit, onBack }: BuyerInfoFormProps) => {
  const [formData, setFormData] = useState<BuyerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<BuyerInfo>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<BuyerInfo> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Delivery address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Insert buyer info into Supabase (table: 'buyers')
      const { data, error } = await supabase
        .from('buyers')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          notes: formData.notes,
          created_at: new Date()
        }])
        .select()
        .single();

      if (error) throw error;

      // Return saved buyer info
      onSubmit(data);
    } catch (err) {
      console.error('Error saving buyer info:', err);
      alert('Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BuyerInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Delivery Information</h2>
        <p className="text-muted-foreground">Please provide your details for order processing and delivery.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Full Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your full name"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          <p className="text-xs text-muted-foreground">Order confirmation will be sent to this email</p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Delivery Address
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter your complete delivery address"
            rows={3}
            className={errors.address ? 'border-destructive' : ''}
          />
          {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> City
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Enter your city"
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> State
          </Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="Enter your state"
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Notes
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any instructions for delivery (optional)"
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back to Order
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-primary to-construction-orange hover:from-primary-hover hover:to-construction-orange/90"
          >
            {loading ? 'Saving...' : 'Continue to Payment'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
