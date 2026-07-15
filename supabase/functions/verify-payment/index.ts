// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { type, customerData } = await req.json();

    const fromEmail = "onboarding@resend.dev";
    const replyTo = "idojuanproperties@gmail.com";

    if (!customerData) {
      throw new Error("Missing customerData in request body.");
    }

    // Helper to send email
    const sendEmail = async ({ to, subject, html }: { to: string, subject: string, html: string }) => {
      return await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        reply_to: replyTo,
      });
    };

    // ---------------------------
    // Payment Confirmation Email
    // ---------------------------
    if (type === "payment_confirmation") {
      const companyHtml = `
        <h2>Payment Received</h2>
        <p>Customer: ${customerData.customerName}</p>
        <p>Amount Paid: ₦${customerData.amount}</p>
        <p>Reference: ${customerData.reference}</p>
      `;
      const customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>Payment Confirmed</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${customerData.customerName},</p>
            <p>We have received your payment of ₦${customerData.amount}.</p>
            <p>Transaction Reference: ${customerData.reference}</p>
            <p>Your order is now being processed.</p>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: "idojuanproperties@gmail.com",
        subject: `Payment Received: ₦${customerData.amount}`,
        html: companyHtml,
      });

      await sendEmail({
        to: customerData.customerEmail,
        subject: `Payment Confirmed - ₦${customerData.amount}`,
        html: customerHtml,
      });
    }

    // ---------------------------
    // Invoice Email
    // ---------------------------
    else if (type === "invoice") {
      const invoiceHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
            <h1>Invoice</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${customerData.customerName},</p>
            <p>Here is your invoice for order ${customerData.orderId}:</p>
            <ul>
              ${customerData.items?.map((item: any) => `<li>${item.quantity}x ${item.name} - ₦${item.total}</li>`).join('')}
            </ul>
            <p><strong>Total Amount:</strong> ₦${customerData.totalAmount}</p>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: customerData.customerEmail,
        subject: `Invoice - Order ${customerData.orderId}`,
        html: invoiceHtml,
      });
    }

    // ---------------------------
    // Delivery Confirmation Email
    // ---------------------------
    else if (type === "delivery_confirmation") {
      const deliveryHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>Delivery Confirmation</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${customerData.customerName},</p>
            <p>Your order ${customerData.orderId} has been successfully delivered.</p>
            <p>We hope you are satisfied with your purchase!</p>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;

      const ratingHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffc107; color: black; padding: 20px; text-align: center;">
            <h1>Rate Your Order</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${customerData.customerName},</p>
            <p>We hope you enjoyed your order! Please rate your experience:</p>
            <p><a href="https://yourwebsite.com/rate-order/${customerData.orderId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rate Now</a></p>
            <p>Thank you for your feedback!</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: customerData.customerEmail,
        subject: `Order ${customerData.orderId} Delivered`,
        html: deliveryHtml,
      });

      await sendEmail({
        to: customerData.customerEmail,
        subject: `We Value Your Feedback for Order ${customerData.orderId}`,
        html: ratingHtml,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
