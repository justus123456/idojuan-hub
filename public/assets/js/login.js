document.addEventListener("DOMContentLoaded", () => {
  if (!window.supabase) {
    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) {
      errorMessage.textContent = "Supabase failed to load. Please refresh the page.";
      errorMessage.style.display = "block";
    }
    return;
  }

  // Replace with your Supabase project URL + anon key
  const supabase = window.supabase.createClient(
    "https://fbkbwshaytjxyaswomxo.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E"
  );

  const authForm = document.getElementById("authForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordToggle = document.getElementById("passwordToggle");
  const submitBtn = document.getElementById("submitBtn");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  if (!authForm || !emailInput || !passwordInput || !submitBtn) return;

  // Show/hide password
  if (passwordToggle) {
    passwordToggle.addEventListener("click", () => {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordToggle.classList.remove("fa-eye");
        passwordToggle.classList.add("fa-eye-slash");
      } else {
        passwordInput.type = "password";
        passwordToggle.classList.remove("fa-eye-slash");
        passwordToggle.classList.add("fa-eye");
      }
    });
  }

  // Handle login
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    if (errorMessage) {
      errorMessage.textContent = "";
      errorMessage.style.display = "none";
    }
    if (successMessage) {
      successMessage.textContent = "";
      successMessage.style.display = "none";
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (errorMessage) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
      }
      submitBtn.disabled = false;
      return;
    }

    if (successMessage) {
      successMessage.textContent = "Login successful! Redirecting...";
      successMessage.style.display = "block";
    }
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 1000);
  });
});
