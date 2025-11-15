document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.token) {
    // Guest → redirect to homepage restricted section
    window.location.href = "index.html#restrictedAccess";
  }
});
