document.addEventListener("DOMContentLoaded", () => {
  if (!window.supabase) {
    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) {
      errorMessage.textContent = "Supabase failed to load. Please refresh the page.";
      errorMessage.style.display = "block";
    }
    return;
  }

  const supabase = window.supabase.createClient(
    "https://fbkbwshaytjxyaswomxo.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2J3c2hheXRqeHlhc3dvbXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzU1MzQsImV4cCI6MjA3Mjc1MTUzNH0.X9H_hL3F6x2zhl0A5frOM-SLrBPnyvy-yKnvE9JmM7E"
  );

  const authForm = document.getElementById("userAuthForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordToggle = document.getElementById("passwordToggle");
  const submitBtn = document.getElementById("submitBtn");
  const submitLabel = document.getElementById("submitLabel");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const formTitle = document.getElementById("formTitle");
  const formSubtitle = document.getElementById("formSubtitle");
  const modeSignIn = document.getElementById("modeSignIn");
  const modeSignUp = document.getElementById("modeSignUp");

  if (!authForm || !emailInput || !passwordInput || !submitBtn) return;

  let mode = "signin";

  const setMode = (nextMode) => {
    mode = nextMode;
    if (formTitle) formTitle.textContent = nextMode === "signup" ? "Create Account" : "User Sign In";
    if (formSubtitle) formSubtitle.textContent = nextMode === "signup"
      ? "Create an account to track your orders"
      : "Enter your email and password";
    if (submitLabel) submitLabel.textContent = nextMode === "signup" ? "Create Account" : "Sign In";
    if (modeSignIn) modeSignIn.classList.toggle("is-active", nextMode === "signin");
    if (modeSignUp) modeSignUp.classList.toggle("is-active", nextMode === "signup");
  };

  setMode("signin");

  modeSignIn?.addEventListener("click", () => setMode("signin"));
  modeSignUp?.addEventListener("click", () => setMode("signup"));

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

    try {
      if (mode === "signup") {
        const nameGuess = email.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/materials-order-page.html`,
            data: {
              name: nameGuess,
              role: "user",
            },
          },
        });
        if (error) throw error;
        const requiresEmailConfirm = !data?.session;
        if (successMessage) {
          successMessage.textContent = requiresEmailConfirm
            ? "Account created. Please check your email to confirm before signing in."
            : "Account created successfully. You can sign in now.";
          successMessage.style.display = "block";
        }
        if (data?.session) {
          localStorage.setItem("user_logged_in", "true");
          const redirectTo = localStorage.getItem("auth_redirect") || "index.html";
          localStorage.removeItem("auth_redirect");
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 800);
          return;
        }
        submitBtn.disabled = false;
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          throw new Error("Email not confirmed. Please check your inbox and confirm your account.");
        }
        throw error;
      }

      if (successMessage) {
        successMessage.textContent = "Login successful! Redirecting...";
        successMessage.style.display = "block";
      }
      localStorage.setItem("user_logged_in", "true");
      localStorage.removeItem("order_history");
      localStorage.removeItem("material_order_state");
      localStorage.removeItem("material_cart");
      localStorage.removeItem("active_order");
      localStorage.removeItem("buyerInfo");
      localStorage.removeItem("currentOrder");
      localStorage.removeItem("last_order");
      const redirectTo = localStorage.getItem("auth_redirect") || "index.html";
      localStorage.removeItem("auth_redirect");
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 800);
    } catch (err) {
      if (errorMessage) {
        errorMessage.textContent = err.message || "Authentication failed.";
        errorMessage.style.display = "block";
      }
    } finally {
      submitBtn.disabled = false;
    }
  });
});
