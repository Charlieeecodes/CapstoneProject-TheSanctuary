document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.token) {
    // Guest mode → redirect them to homepage restricted area
    window.location.href = "index.html#restrictedAccess";
  }
});
