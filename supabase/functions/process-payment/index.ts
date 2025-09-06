import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, amount, customerData } = await req.json()
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')

    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amount * 100, // Paystack expects amount in kobo
        callback_url: `${req.url.split('/supabase/functions')[0]}/payment-success.html`,
        metadata: {
          customer_name: customerData.customerName,
          customer_phone: customerData.customerPhone,
          order_id: customerData.orderId,
          delivery_location: customerData.deliveryLocation,
        },
      }),
    })

    const result = await response.json()

    if (!result.status) {
      throw new Error(result.message || 'Payment initialization failed')
    }

    return new Response(JSON.stringify({
      status: 'success',
      data: {
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      status: 'error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})