document.addEventListener("DOMContentLoaded", async () => {
  const navMenu = document.getElementById("navMenu");
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const inquiriesList = document.getElementById("inquiriesList");

  // ----------------------------
  // PROTECT PAGE
  // ----------------------------
  let user = null;
  try { 
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  if (!user || !user.token) {
    alert("Please log in to access your profile.");
    window.location.href = "login.html";
    return;
  }

  // ----------------------------
  // NAVBAR FOR LOGGED-IN USERS
  // ----------------------------
  navMenu.innerHTML = `
    <li><a href="index.html">Home</a></li>
    <li><a href="services.html">Services</a></li>
    <li><a href="gallery.html">Gallery</a></li>
    <li><a href="about.html">About Us</a></li>
    <li><a href="inquiry.html">Submit Inquiry</a></li>
    <li><a href="feedback.html">Feedback</a></li>
    <li><a href="profile.html" class="active">My Profile</a></li>
    <li><a href="#" id="logoutBtn">Logout</a></li>
  `;

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  };

  // ----------------------------
  // DISPLAY USER INFO
  // ----------------------------
  userNameEl.textContent = user.name;
  userEmailEl.textContent = user.email;

  // ----------------------------
  // FETCH USER INQUIRIES
  // ----------------------------
  try {
    const res = await fetch(`http://localhost:5000/api/inquiries/user/${user.id}`, {
      headers: {
        "Authorization": `Bearer ${user.token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      inquiriesList.innerHTML = "<p>Failed to load inquiries.</p>";
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      inquiriesList.innerHTML = "<p>You haven't submitted any inquiries yet.</p>";
      return;
    }

    // Display list
    inquiriesList.innerHTML = data.map(inq => `
      <div class="inquiry-card">
        <p><strong>Subject:</strong> ${inq.subject}</p>
        <p><strong>Message:</strong> ${inq.message}</p>
        <p><strong>Date:</strong> ${new Date(inq.created_at).toLocaleString()}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${inq.status.toLowerCase()}">${inq.status}</span></p>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    inquiriesList.innerHTML = "<p>Error loading inquiries.</p>";
  }
});
