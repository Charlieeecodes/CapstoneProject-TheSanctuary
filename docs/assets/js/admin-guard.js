// docs/assets/js/admin-guard.js

(async function adminGuard() {
  const token = localStorage.getItem("adminToken");

  // No token → go login
  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }

  // Token exists → verify with backend
  try {
    const res = await fetch("/api/auth/admin/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Unauthorized");
  } catch (err) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRememberUser");
    window.location.href = "admin-login.html";
  }
})();

// 🚪 Logout button handler
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("btnLogout");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRememberUser");
    window.location.href = "admin-login.html";
  });
});
