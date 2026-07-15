-- Saved properties for user favorites
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved properties" ON public.saved_properties
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can save properties" ON public.saved_properties
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove saved properties" ON public.saved_properties
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON public.saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON public.saved_properties(property_id);
