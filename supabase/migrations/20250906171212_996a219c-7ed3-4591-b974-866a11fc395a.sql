-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'client');

-- Create enum for property status
CREATE TYPE public.property_status AS ENUM ('available', 'sold', 'reserved', 'under_review');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  location TEXT NOT NULL,
  size_sqft INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  status property_status NOT NULL DEFAULT 'available',
  images TEXT[] DEFAULT '{}',
  listed_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create material categories table
CREATE TABLE public.material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.material_categories(id),
  image TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  order_status order_status NOT NULL DEFAULT 'pending',
  paystack_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  property_id UUID REFERENCES public.properties(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('material', 'property')),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order tracking table
CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- RLS Policies for properties
CREATE POLICY "Anyone can view available properties" ON public.properties
  FOR SELECT USING (true);

CREATE POLICY "Admins and managers can insert properties" ON public.properties
  FOR INSERT WITH CHECK (public.get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update properties" ON public.properties
  FOR UPDATE USING (public.get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admins can delete properties" ON public.properties
  FOR DELETE USING (public.get_current_user_role() = 'admin');

-- RLS Policies for material categories
CREATE POLICY "Anyone can view categories" ON public.material_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.material_categories
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for materials
CREATE POLICY "Anyone can view materials" ON public.materials
  FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage materials" ON public.materials
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'manager'));

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (customer_id = auth.uid() OR customer_id IS NULL);

CREATE POLICY "Admins and managers can view all orders" ON public.orders
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update orders" ON public.orders
  FOR UPDATE USING (public.get_current_user_role() IN ('admin', 'manager'));

-- RLS Policies for order items
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.customer_id = auth.uid() OR public.get_current_user_role() IN ('admin', 'manager'))
    )
  );

CREATE POLICY "Users can create order items for their orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.customer_id = auth.uid() OR orders.customer_id IS NULL)
    )
  );

-- RLS Policies for contacts
CREATE POLICY "Anyone can create contacts" ON public.contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and managers can view contacts" ON public.contacts
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update contacts" ON public.contacts
  FOR UPDATE USING (public.get_current_user_role() IN ('admin', 'manager'));

-- RLS Policies for order tracking
CREATE POLICY "Users can view tracking for their orders" ON public.order_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_tracking.order_id 
      AND (orders.customer_id = auth.uid() OR public.get_current_user_role() IN ('admin', 'manager'))
    )
  );

CREATE POLICY "Admins and managers can manage tracking" ON public.order_tracking
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO order_count FROM public.orders;
  RETURN 'IDO-' || LPAD((order_count + 1)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default material categories
INSERT INTO public.material_categories (name, description) VALUES
  ('Cement & Concrete', 'Cement, concrete blocks, and related materials'),
  ('Steel & Iron', 'Rebar, steel sheets, iron rods, and metal structures'),
  ('Roofing Materials', 'Roofing sheets, tiles, gutters, and accessories'),
  ('Plumbing', 'Pipes, fittings, tanks, and plumbing accessories'),
  ('Electrical', 'Wires, switches, sockets, and electrical components'),
  ('Tiles & Flooring', 'Floor tiles, wall tiles, and flooring materials'),
  ('Paints & Finishes', 'Paints, primers, brushes, and finishing materials'),
  ('Doors & Windows', 'Doors, windows, frames, and hardware'),
  ('Insulation', 'Thermal and sound insulation materials'),
  ('Tools & Equipment', 'Construction tools and equipment');

-- Create indexes for better performance
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_location ON public.properties(location);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at);
CREATE INDEX idx_materials_category_id ON public.materials(category_id);