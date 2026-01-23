function adminAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options.headers || {}),
      ...adminAuthHeaders(),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("❌ Request failed:", res.status, url, text);
    throw new Error(`Request failed (${res.status})`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("❌ Invalid JSON:", url, text);
    throw new Error("Invalid server response");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const sidebarContainer = document.querySelector(".inquiries-container");
  const detailPanel = document.getElementById("inquiry-full-content");

  if (!sidebarContainer || !detailPanel) return;

  /* ================================
     📥 FETCH INQUIRIES
  ================================ */
  async function fetchInquiries() {
    try {
      return await fetchJSON("http://localhost:5000/api/inquiries");
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      return [];
    }
  }

  /* ================================
     📋 LOAD SIDEBAR
  ================================ */
  async function loadInquiries() {
    sidebarContainer.innerHTML = "<p>Loading inquiries...</p>";

    try {
      const data = await fetchInquiries();
      const safeData = Array.isArray(data) ? data : [];

      if (safeData.length === 0) {
        sidebarContainer.innerHTML = "<p>No inquiries found.</p>";
        return;
      }

      safeData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      sidebarContainer.innerHTML = safeData
        .map((inquiry) => {
          const statusColor =
            inquiry.status === "Resolved"
              ? "status-resolved"
              : inquiry.status === "In Progress"
              ? "status-progress"
              : "status-pending";

          return `
            <div class="inquiry-card" data-id="${inquiry.id}">
              <div>
                <p><strong>ID:</strong> ${inquiry.id}</p>
                <p><strong>Name:</strong> ${inquiry.name || "—"}</p>
                <p><strong>Subject:</strong> ${inquiry.subject || "—"}</p>
                <p><small>${new Date(inquiry.created_at).toLocaleString()}</small></p>
              </div>
              <div class="status-and-button">
                <span class="status-badge ${statusColor}">${inquiry.status || "Pending"}</span>
                <button class="view-btn" data-id="${inquiry.id}">View</button>
              </div>
            </div>
          `;
        })
        .join("");

      attachCardEvents(safeData);
    } catch (err) {
      console.error("Error loading inquiries:", err);
      sidebarContainer.innerHTML = `<p style="color:red;">Error loading inquiries.</p>`;
    }
  }

  /* ================================
     👁️ VIEW INQUIRY
  ================================ */
  function attachCardEvents(inquiries) {
    document.querySelectorAll(".view-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.id);
        const inquiry = inquiries.find((i) => i.id === id);
        if (!inquiry) return;

        detailPanel.innerHTML = `
          <h3>Inquiry #${inquiry.id}</h3>
          <p><strong>Name:</strong> ${inquiry.name}</p>
          <p><strong>Email:</strong> ${inquiry.email}</p>
          <p><strong>Subject:</strong> ${inquiry.subject}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <div class="message-box">${inquiry.message}</div>
          <hr>
          <p><strong>Status:</strong>
            <select id="statusSelect">
              <option value="Pending" ${inquiry.status === "Pending" ? "selected" : ""}>Pending</option>
              <option value="In Progress" ${inquiry.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option value="Resolved" ${inquiry.status === "Resolved" ? "selected" : ""}>Resolved</option>
            </select>
          </p>
          <p><strong>Date:</strong> ${new Date(inquiry.created_at).toLocaleString()}</p>
          <button id="deleteBtn" class="delete-btn">🗑️ Delete Inquiry</button>
          <hr>
          <div class="send-message-form">
            <h4>Send a Response</h4>
            <p><strong>To:</strong> <span id="recipientEmail">${inquiry.email}</span></p>
            <textarea id="responseMessage" rows="5" placeholder="Write your message..."></textarea>
            <button id="sendMessageBtn">Send Message</button>
          </div>
        `;

        /* ================================
           🔄 UPDATE STATUS
        ================================ */
        document.getElementById("statusSelect").addEventListener("change", async (e) => {
          try {
            await fetchJSON(`http://localhost:5000/api/inquiries/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: e.target.value }),
            });

            await loadInquiries();
            notifyDashboardUpdate();
          } catch (err) {
            alert("Failed to update status.");
          }
        });

        /* ================================
           🗑️ DELETE
        ================================ */
        document.getElementById("deleteBtn").addEventListener("click", async () => {
          if (!confirm("Delete this inquiry?")) return;

          try {
            await fetchJSON(`http://localhost:5000/api/inquiries/${id}`, {
              method: "DELETE",
            });

            detailPanel.innerHTML = "<p>Select an inquiry from the left.</p>";
            await loadInquiries();
            notifyDashboardUpdate();
          } catch (err) {
            alert("Failed to delete inquiry.");
          }
        });

        /* ================================
           ✉️ SEND MESSAGE
        ================================ */
        document.getElementById("sendMessageBtn").addEventListener("click", async () => {
          const message = document.getElementById("responseMessage").value.trim();
          if (!message) return alert("Message cannot be empty.");

          try {
            await fetchJSON("http://localhost:5000/api/inquiries/sendMessage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: inquiry.email,
                message,
                inquiryId: id,
              }),
            });

            document.getElementById("responseMessage").value = "";
            alert("✅ Message sent successfully!");
          } catch (err) {
            alert("Failed to send message.");
          }
        });
      });
    });
  }

  function notifyDashboardUpdate() {
    localStorage.setItem("dashboardNeedsRefresh", "true");
  }

  /* ================================
     🚀 INIT
  ================================ */
  await loadInquiries();
});

/* ================================
   🔁 AUTO-OPEN FROM DASHBOARD
================================ */
const selectedId = sessionStorage.getItem("selectedInquiryId");
if (selectedId) {
  setTimeout(() => {
    const btn = document.querySelector(`.inquiry-card[data-id="${selectedId}"] .view-btn`);
    if (btn) btn.click();
    sessionStorage.removeItem("selectedInquiryId");
  }, 500);
}
