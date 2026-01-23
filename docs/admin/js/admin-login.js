// docs/assets/js/admin-login.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("adminLoginForm");
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");
  const rememberEl = document.getElementById("rememberUser");
  const errorEl = document.getElementById("loginError");

  const btnLogin = document.getElementById("btnLogin");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");

  const toggleBtn = document.getElementById("togglePassword");
  console.log("✅ admin-login.js loaded");
  if (!form) {
  console.error("❌ adminLoginForm not found. Check your form id in admin-login.html");
  return;
  }
  if (!usernameEl || !passwordEl) {
    console.error("❌ username/password input not found. Check element IDs.");
    return;
  }

  // ✅ Auto-redirect if already logged in (token exists + valid)
  const existingToken = localStorage.getItem("adminToken");
  if (existingToken) {
    try {
      const res = await fetch("/api/auth/admin/me", {
        headers: { Authorization: `Bearer ${existingToken}` }
      });
      if (res.ok) {
        window.location.href = "dashboard.html";
        return;
      }
      localStorage.removeItem("adminToken");
    } catch {
      localStorage.removeItem("adminToken");
    }
  }

  // ✅ Remember username (optional)
  const savedUser = localStorage.getItem("adminRememberUser");
  if (savedUser) {
    usernameEl.value = savedUser;
    rememberEl.checked = true;
  }

  function setLoading(isLoading) {
    btnLogin.disabled = isLoading;
    btnText.textContent = isLoading ? "Logging in..." : "Login";
    btnSpinner.style.display = isLoading ? "inline-block" : "none";
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = "block";
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }

  // Show/Hide password
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isHidden = passwordEl.type === "password";
      passwordEl.type = isHidden ? "text" : "password";
      toggleBtn.textContent = isHidden ? "Hide" : "Show";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    
    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    if (!username || !password) {
      showError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !data.token) {
        showError(data.message || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // ✅ Save token
      localStorage.setItem("adminToken", data.token);

      // ✅ Remember username only (optional)
      if (rememberEl.checked) {
        localStorage.setItem("adminRememberUser", username);
      } else {
        localStorage.removeItem("adminRememberUser");
      }

      // ✅ Redirect to admin dashboard
      window.location.href = "dashboard.html";
    } catch (err) {
      showError("Server error. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  });
});
