import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { reference } = await req.json()
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    })

    const result = await response.json()

    if (!result.status || result.data.status !== 'success') {
      throw new Error('Payment verification failed')
    }

    const paymentData = result.data
    const metadata = paymentData.metadata

    // Update order status in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        paystack_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.order_id)

    if (updateError) {
      console.error('Error updating order:', updateError)
    }

    // Send payment confirmation email
    await fetch(`${req.url.split('/supabase/functions')[0]}/supabase/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        to: paymentData.customer.email,
        subject: 'Payment Confirmation - IDO-JUAN Properties',
        type: 'payment_confirmation',
        customerData: {
          customerName: metadata.customer_name,
          amount: (paymentData.amount / 100).toLocaleString(),
          reference: reference,
          orderId: metadata.order_id,
        }
      })
    })

    return new Response(JSON.stringify({
      status: 'success',
      data: {
        reference: reference,
        amount: paymentData.amount / 100,
        customer_email: paymentData.customer.email,
        payment_date: paymentData.paid_at,
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