
  // ✅ Replace with your Supabase project URL + anon key
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

  // ✅ Show/hide password
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

  // ✅ Handle login
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    errorMessage.textContent = "";
    successMessage.textContent = "";

    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      errorMessage.textContent = error.message;
      submitBtn.disabled = false;
      return;
    }

    // ✅ Redirect to admin.html on success
    successMessage.textContent = "Login successful! Redirecting...";
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 1000);
  });

