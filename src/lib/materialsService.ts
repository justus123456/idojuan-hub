import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchMaterials() {
  const { data, error } = await supabase
    .from("materials")
    .select("id, name, description, unit_price, stock_quantity, unit, image, created_at");

  if (error) throw error;
  return data;
}
