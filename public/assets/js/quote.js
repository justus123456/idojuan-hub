const form = document.getElementById('quote-form');

if (form) form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Hide previous messages
  const sentMessage = form.querySelector('.sent-message');
  const errorMessage = form.querySelector('.error-message');
  sentMessage.style.display = 'none';
  errorMessage.style.display = 'none';

  // Collect form values
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const type = form.type.value;
  const timeline = form.timeline.value;
  const budget = form.budget.value.trim();
  const message = form.message.value.trim();

  const detailsHtml = `
    <h2>New Quote Request</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
    <p><strong>Project Type:</strong> ${type || "Not specified"}</p>
    <p><strong>Timeline:</strong> ${timeline || "Not specified"}</p>
    <p><strong>Budget:</strong> ${budget || "Not specified"}</p>
    <p><strong>Project Details:</strong></p>
    <div style="background:#f5f5f5;padding:12px;border-radius:6px;">
      ${message || "No additional details provided."}
    </div>
  `;

  // Payload for Supabase function
  const payload = {
    to: email, // Customer confirmation
    subject: "Your Quote Request Received",
    type: "quote",
    html: detailsHtml,
    customerData: {
      name,
      email,
      phone,
      message: message || "No additional details provided.",
      type,
      timeline,
      budget
    }
  };

  try {
    const res = await fetch('https://fbkbwshaytjxyaswomxo.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E', // if required
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E' // if required
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      sentMessage.style.display = 'block';
      form.reset();
    } else {
      errorMessage.textContent = data.error || 'Something went wrong';
      errorMessage.style.display = 'block';
    }
  } catch (err) {
    errorMessage.textContent = err.message;
    errorMessage.style.display = 'block';
  }
});
