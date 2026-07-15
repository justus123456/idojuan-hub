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
    const { to, subject, html, type, customerData } = await req.json();

    let emailContent = html;
    const fromEmail = "onboarding@resend.dev";
    const replyTo = "idojuanproperties@gmail.com";

    // ---------------------------
    // Contact Emails
    // ---------------------------
    if (type === "contact") {
      // Company notification
      await resend.emails.send({
        from: fromEmail,
        to: "idojuanproperties@gmail.com",
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${customerData?.name || "Unknown"}</p>
          <p><strong>Email:</strong> ${customerData?.email || "Unknown"}</p>
          <p><strong>Phone:</strong> ${customerData?.phone || "Not provided"}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${customerData?.message || html}
          </div>
        `,
      });

      // Customer confirmation
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
            <h1>IDO-JUAN Properties</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Thank you for contacting us!</h2>
            <p>Dear ${customerData?.name || "Valued Customer"},</p>
            <p>We have received your message and will get back to you within 24 hours.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${customerData?.message || html}
            </div>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;
    }

    // ---------------------------
    // Investment Emails
    // ---------------------------
    else if (type === "investment") {
      await resend.emails.send({
        from: fromEmail,
        to: "idojuanproperties@gmail.com",
        subject: `New Investment Inquiry: ${customerData?.budget || "Unknown Budget"}`,
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
      });

      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
            <h1>IDO-JUAN Properties Investment Services</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Investment Consultation Request Received!</h2>
            <p>Dear ${customerData?.name},</p>
            <p>Thank you for your interest in our investment services. Our specialists will contact you within 24 hours.</p>
            <p><strong>Your Investment Details:</strong></p>
            <ul>
              <li>Budget Range: ${customerData?.budget}</li>
              <li>Contact: ${customerData?.phone}</li>
            </ul>
            <p>Best regards,<br>IDO-JUAN Properties Investment Team</p>
          </div>
        </div>
      `;
    }

    // ---------------------------
    // Quote Emails
    // ---------------------------
    else if (type === "quote") {
      await resend.emails.send({
        from: fromEmail,
        to: "idojuanproperties@gmail.com",
        subject: `New Quote Request: ${customerData?.type || "Project Quote"}`,
        html: `
          <h2>New Quote Request</h2>
          <p><strong>Name:</strong> ${customerData?.name || "Unknown"}</p>
          <p><strong>Email:</strong> ${customerData?.email || "Unknown"}</p>
          <p><strong>Phone:</strong> ${customerData?.phone || "Not provided"}</p>
          <p><strong>Project Type:</strong> ${customerData?.type || "Not specified"}</p>
          <p><strong>Timeline:</strong> ${customerData?.timeline || "Not specified"}</p>
          <p><strong>Budget:</strong> ${customerData?.budget || "Not specified"}</p>
          <p><strong>Project Details:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${customerData?.message || html}
          </div>
        `,
      });

      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
            <h1>IDO-JUAN Properties</h1>
          </div>
          <div style="padding: 20px;">
            <h2>We received your quote request!</h2>
            <p>Dear ${customerData?.name || "Valued Customer"},</p>
            <p>Thanks for your request. Our team will review your details and respond within 24 hours.</p>
            <p><strong>Your Request Summary:</strong></p>
            <ul>
              <li>Project Type: ${customerData?.type || "Not specified"}</li>
              <li>Timeline: ${customerData?.timeline || "Not specified"}</li>
              <li>Budget: ${customerData?.budget || "Not specified"}</li>
              <li>Contact: ${customerData?.phone || "Not provided"}</li>
            </ul>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${customerData?.message || html}
            </div>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;
    }

    // ---------------------------
    // Order Confirmation Emails
    // ---------------------------
    else if (type === "order_confirmation") {
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
              <ul>
                ${customerData?.items?.map(item => `<li>${item.quantity}x ${item.name} - ₦${item.total}</li>`).join('')}
              </ul>
            </div>
            <p>We will contact you shortly with delivery arrangements.</p>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: fromEmail,
        to: "idojuanproperties@gmail.com",
        subject: `New Materials Order: ${customerData?.orderId}`,
        html: emailContent,
      });
    }

    // ---------------------------
    // Payment Confirmation Emails
    // ---------------------------
    else if (type === "payment_confirmation") {
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
              <p><strong>Transaction Reference:</strong> ${customerData?.reference}</p>
              <p><strong>Amount Paid:</strong> ₦${customerData?.amount}</p>
              <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Your order is now being processed and will be prepared for delivery.</p>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: fromEmail,
        to: "idojuanproperties@gmail.com",
        subject: `Payment Received: ₦${customerData?.amount}`,
        html: emailContent,
      });
    }

    // ---------------------------
    // Invoice Email (New)
    // ---------------------------
    else if (type === "invoice") {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c5aa0; color: white; padding: 20px; text-align: center;">
            <h1>Invoice - IDO-JUAN Properties</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${customerData?.customerName},</p>
            <p>Thank you for your order. Here is your invoice:</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Order ID:</strong> ${customerData?.orderId}</p>
              <p><strong>Total Amount:</strong> ₦${customerData?.totalAmount}</p>
              <ul>
                ${customerData?.items?.map(item => `<li>${item.quantity}x ${item.name} - ₦${item.total}</li>`).join('')}
              </ul>
            </div>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;
    }

    // ---------------------------
    // Delivery Confirmation Email (New)
    // ---------------------------
    else if (type === "delivery_confirmation") {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>Delivery Confirmation - IDO-JUAN Properties</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${customerData?.customerName},</p>
            <p>Your order ${customerData?.orderId} has been successfully delivered.</p>
            <p>We hope you are satisfied with your purchase!</p>
            <p>Best regards,<br>IDO-JUAN Properties Team</p>
          </div>
        </div>
      `;

      // Optional: Trigger rating request email after delivery
      await resend.emails.send({
        from: fromEmail,
        to: customerData?.customerEmail,
        subject: `Order ${customerData?.orderId} Delivered`,
        html: emailContent,
        reply_to: replyTo,
      });

      // Optional rating email
      const ratingEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffc107; color: black; padding: 20px; text-align: center;">
            <h1>Rate Your Order - IDO-JUAN Properties</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${customerData?.customerName},</p>
            <p>We hope you enjoyed your order! Please take a moment to rate your experience:</p>
            <p><a href="https://yourwebsite.com/rate-order/${customerData?.orderId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rate Now</a></p>
            <p>Thank you for your feedback!</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: fromEmail,
        to: customerData?.customerEmail,
        subject: `We Value Your Feedback for Order ${customerData?.orderId}`,
        html: ratingEmail,
        reply_to: replyTo,
      });
    }

    // ---------------------------
    // Send the main email
    // ---------------------------
    const result = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: emailContent,
      reply_to: replyTo,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
