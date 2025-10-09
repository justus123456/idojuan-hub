import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, amount, customerData } = await req.json();

    // Supabase secrets are accessed via Deno.env
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ status: "error", message: "Paystack key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
        callback_url: `${req.url.split("/supabase/functions")[0]}/payment-success.html`,
        metadata: {
          customer_name: customerData.customerName,
          customer_phone: customerData.customerPhone,
          order_id: customerData.orderId,
          delivery_location: customerData.deliveryLocation,
        },
      }),
    });

    const result = await response.json();

    if (!result.status) {
      throw new Error(result.message || "Payment initialization failed");
    }

    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          authorization_url: result.data.authorization_url,
          access_code: result.data.access_code,
          reference: result.data.reference,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: error?.message || "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
