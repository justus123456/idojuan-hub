// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    const { to, subject, html, type, customerData } = await req.json()

    let emailContent = html
    let fromEmail = 'onboarding@resend.dev'
    let replyTo = 'idojuanproperties@gmail.com'

    // Handle different email types
    if (type === 'contact') {
      // Send notification to company
      await resend.emails.send({
        from: fromEmail,
        to: 'idojuanproperties@gmail.com',
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${customerData?.name || 'Unknown'}</p>
          <p><strong>Email:</strong> ${customerData?.email || 'Unknown'}</p>
          <p><strong>Phone:</strong> ${customerData?.phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${customerData?.message || html}
          </div>
        `,
      })

      // Send confirmation to customer
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
            <h1>IDO-JUAN Properties</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Thank you for contacting us!</h2>
            <p>Dear ${customerData?.name || 'Valued Customer'},</p>
            <p>We have received your message and will get back to you within 24 hours.</p>
            <p><strong>Your message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${customerData?.message || html}
            </div>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `
    } else if (type === 'investment') {
      // Send investment inquiry notification
      await resend.emails.send({
        from: fromEmail,
        to: 'idojuanproperties@gmail.com',
        subject: `New Investment Inquiry: ${customerData?.budget || 'Unknown Budget'}`,
        html: `
          <h2>New Investment Inquiry</h2>
          <p><strong>Name:</strong> ${customerData?.name}</p>
          <p><strong>Email:</strong> ${customerData?.email}</p>
          <p><strong>Phone:</strong> ${customerData?.phone}</p>
          <p><strong>Investment Budget:</strong> ${customerData?.budget}</p>
          <p><strong>Investment Goals:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${customerData?.message}
          </div>
        `,
      })

      // Send confirmation to customer
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
            <h1>IDO-JUAN Properties Investment Services</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Investment Consultation Request Received!</h2>
            <p>Dear ${customerData?.name},</p>
            <p>Thank you for your interest in our investment services. Our investment specialists will contact you within 24 hours to discuss your investment goals.</p>
            <p><strong>Your Investment Details:</strong></p>
            <ul>
              <li>Budget Range: ${customerData?.budget}</li>
              <li>Contact: ${customerData?.phone}</li>
            </ul>
            <p>We look forward to helping you achieve your investment goals.</p>
            <p>Best regards,<br>IDO-JUAN Properties Investment Team</p>
          </div>
        </div>
      `
    } else if (type === 'order_confirmation') {
      // Send order confirmation to customer
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>Order Confirmation - IDO-JUAN Properties</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Your Order Has Been Confirmed!</h2>
            <p>Dear ${customerData?.customerName},</p>
            <p>Thank you for your order. Here are the details:</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Order Details:</h3>
              <p><strong>Order ID:</strong> ${customerData?.orderId}</p>
              <p><strong>Total Amount:</strong> ₦${customerData?.totalAmount}</p>
              <p><strong>Delivery Location:</strong> ${customerData?.deliveryLocation}</p>
              <p><strong>Items Ordered:</strong></p>
              <ul>
                ${customerData?.items?.map(item => `<li>${item.quantity}x ${item.name} - ₦${item.total}</li>`).join('') || ''}
              </ul>
            </div>
            <p>We will contact you shortly with delivery arrangements.</p>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `

      // Also send notification to company
      await resend.emails.send({
        from: fromEmail,
        to: 'idojuanproperties@gmail.com',
        subject: `New Materials Order: ${customerData?.orderId}`,
        html: `
          <h2>New Materials Order Received</h2>
          <p><strong>Customer:</strong> ${customerData?.customerName}</p>
          <p><strong>Email:</strong> ${customerData?.customerEmail}</p>
          <p><strong>Phone:</strong> ${customerData?.customerPhone}</p>
          <p><strong>Order ID:</strong> ${customerData?.orderId}</p>
          <p><strong>Total Amount:</strong> ₦${customerData?.totalAmount}</p>
          <p><strong>Delivery Location:</strong> ${customerData?.deliveryLocation}</p>
          <p><strong>Items:</strong></p>
          <ul>
            ${customerData?.items?.map(item => `<li>${item.quantity}x ${item.name} - ₦${item.total}</li>`).join('') || ''}
          </ul>
        `,
      })
    } else if (type === 'payment_confirmation') {
      // Send payment confirmation
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>Payment Confirmed - IDO-JUAN Properties</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Payment Successfully Received!</h2>
            <p>Dear ${customerData?.customerName},</p>
            <p>We have successfully received your payment of ₦${customerData?.amount}.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Payment Details:</h3>
              <p><strong>Transaction Reference:</strong> ${customerData?.reference}</p>
              <p><strong>Amount Paid:</strong> ₦${customerData?.amount}</p>
              <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Your order is now being processed and will be prepared for delivery.</p>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `

      // Send notification to company
      await resend.emails.send({
        from: fromEmail,
        to: 'idojuanproperties@gmail.com',
        subject: `Payment Received: ₦${customerData?.amount}`,
        html: `
          <h2>Payment Confirmation</h2>
          <p><strong>Customer:</strong> ${customerData?.customerName}</p>
          <p><strong>Amount:</strong> ₦${customerData?.amount}</p>
          <p><strong>Reference:</strong> ${customerData?.reference}</p>
          <p><strong>Order ID:</strong> ${customerData?.orderId}</p>
        `,
      })
    }

    // Send the main email
    const result = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: emailContent,
      reply_to: replyTo,
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
if (type === 'quote') {
  // Send notification to company
  await resend.emails.send({
    from: fromEmail,
    to: 'idojuanproperties@gmail.com',
    subject: `New Quote Request: ${customerData?.name}`,
    html: `
      <h2>New Quote Request</h2>
      <p><strong>Name:</strong> ${customerData?.name}</p>
      <p><strong>Email:</strong> ${customerData?.email}</p>
      <p><strong>Phone:</strong> ${customerData?.phone}</p>
      <p><strong>Project Type:</strong> ${customerData?.type}</p>
      <p><strong>Timeline:</strong> ${customerData?.timeline}</p>
      <p><strong>Budget:</strong> ${customerData?.budget || 'Not provided'}</p>
      <p><strong>Description:</strong></p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
        ${customerData?.message}
      </div>
    `,
  });

  // Send confirmation to customer
  emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
        <h1>IDO-JUAN Properties</h1>
      </div>
      <div style="padding: 20px;">
        <h2>Thank you for your quote request!</h2>
        <p>Dear ${customerData?.name},</p>
        <p>We have received your request and will review your project details. Our team will contact you within 24 hours.</p>
        <p><strong>Your Project Details:</strong></p>
        <ul>
          <li>Project Type: ${customerData?.type}</li>
          <li>Expected Timeline: ${customerData?.timeline}</li>
          <li>Budget: ${customerData?.budget || 'Not provided'}</li>
        </ul>
        <p><strong>Description:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${customerData?.message}
        </div>
        <p>Best regards,<br>IDO-JUAN Properties Team</p>
      </div>
    </div>
  `;
}
