function adminAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  if (!token) return {}; // ✅ prevents "Bearer null"
  return { Authorization: `Bearer ${token}` };
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("📊 [Dashboard] Page Loaded");

  // -----------------------------
  // Element references
  // -----------------------------
  const totalInquiriesEl = document.getElementById("totalInquiries");
  const totalFeedbacksEl = document.querySelector(".stat-card:nth-child(2) .value");
  const totalServicesEl = document.querySelector(".stat-card:nth-child(3) .value");
  const topServiceEl = document.querySelector(".stat-card:nth-child(4) .value");

  const tableBody = document.querySelector("#inquiryTable tbody");
  const recentUpdatesContainer = document.getElementById("recentUpdates");
  const inquiriesPeriodSelect = document.getElementById("inquiriesPeriod");

  // -----------------------------
  // Base URLs
  // -----------------------------
  const BASE = "http://localhost:5000";
  const URLS = {
    inquiries: `${BASE}/api/inquiries`,
    feedbacks: `${BASE}/api/feedbacks`,
    kpis: `${BASE}/api/analytics/kpis`,
    inquiriesByPeriod: (period) =>
      `${BASE}/api/analytics/inquiries?period=${encodeURIComponent(period)}&mode=summary`,
  };

  // -----------------------------
  // Generic fetch helper (with auth + ok check)
  // -----------------------------
  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        ...(options.headers || {}),
        ...adminAuthHeaders(),
      },
    });

    // If backend returns HTML on error, json() will throw — so read text safely
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`❌ Request failed: ${res.status} ${res.statusText}`, { url, text });
      throw new Error(`Request failed (${res.status})`);
    }

    // Parse JSON safely
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("❌ Invalid JSON returned from server:", { url, text });
      throw new Error("Invalid server response");
    }
  }

  // -----------------------------
  // Fetch data helpers
  // -----------------------------
  async function fetchInquiries() {
    return await fetchJSON(URLS.inquiries);
  }

  async function fetchFeedbacks() {
    return await fetchJSON(URLS.feedbacks);
  }

  async function fetchInquiriesByPeriod(period) {
    try {
      const json = await fetchJSON(URLS.inquiriesByPeriod(period));
      return json; // expects { total: number } or similar
    } catch (err) {
      console.error("[dashboard] fetchInquiriesByPeriod error:", err);
      return { total: 0 };
    }
  }

  // -----------------------------
  // Load KPIs
  // -----------------------------
  async function loadKPIs() {
    try {
      const data = await fetchJSON(URLS.kpis);

      if (totalInquiriesEl) totalInquiriesEl.textContent = data.totalInquiries ?? 0;
      if (totalFeedbacksEl) totalFeedbacksEl.textContent = data.totalFeedbacks ?? 0;
      if (totalServicesEl) totalServicesEl.textContent = data.totalServices ?? 0;
      if (topServiceEl) topServiceEl.textContent = data.topService ?? "N/A";
    } catch (err) {
      console.error("❌ Error loading KPIs:", err);

      // Optional: show fallback values instead of leaving blanks
      if (totalInquiriesEl) totalInquiriesEl.textContent = "—";
      if (totalFeedbacksEl) totalFeedbacksEl.textContent = "—";
      if (totalServicesEl) totalServicesEl.textContent = "—";
      if (topServiceEl) topServiceEl.textContent = "—";
    }
  }

  // -----------------------------
  // Inquiries tracking (total only)
  // -----------------------------
  async function loadDashboardInquiries(period = "month") {
    try {
      const data = await fetchInquiriesByPeriod(period);
      const total = Number(data.total) || 0;
      if (totalInquiriesEl) totalInquiriesEl.textContent = total;
    } catch (err) {
      console.error("[dashboard] loadDashboardInquiries error:", err);
      if (totalInquiriesEl) totalInquiriesEl.textContent = "Error";
    }
  }

  // -----------------------------
  // Load recent updates
  // -----------------------------
  async function loadRecentUpdates() {
    if (!recentUpdatesContainer) return;

    try {
      const [inquiries, feedbacks] = await Promise.all([fetchInquiries(), fetchFeedbacks()]);

      const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
      const safeFeedbacks = Array.isArray(feedbacks) ? feedbacks : [];

      const combined = [
        ...safeInquiries.map((i) => ({
          type: "Inquiry",
          id: i.id,
          name: i.name,
          email: i.email,
          message: i.message,
          date: i.created_at,
        })),
        ...safeFeedbacks.map((f) => ({
          type: "Feedback",
          id: f.id,
          name: f.name,
          email: f.email,
          message: f.message,
          date: f.created_at,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      recentUpdatesContainer.innerHTML = combined
        .slice(0, 6)
        .map(
          (update) => `
        <div class="update-card ${update.type.toLowerCase()}" data-type="${update.type}" data-id="${update.id}">
          <h4>${update.type}</h4>
          <p><strong>${update.name || "—"}</strong> (${update.email || "—"})</p>
          <p>${update.message || "—"}</p>
          <small>${update.date ? new Date(update.date).toLocaleString() : ""}</small>
        </div>
      `
        )
        .join("");

      document.querySelectorAll(".update-card").forEach((card) => {
        card.addEventListener("click", () => {
          const type = card.dataset.type;
          const id = card.dataset.id;

          if (type === "Inquiry") {
            sessionStorage.setItem("selectedInquiryId", id);
            window.location.href = "inquiries.html";
          } else if (type === "Feedback") {
            sessionStorage.setItem("selectedFeedbackId", id);
            window.location.href = "feedbacks.html";
          }
        });
      });
    } catch (err) {
      console.error("Error loading updates:", err);
      recentUpdatesContainer.innerHTML = `<p style="color:red;">Error loading updates.</p>`;
    }
  }

  // -----------------------------
  // Load recent inquiries table
  // -----------------------------
  async function loadRecentInquiries() {
    if (!tableBody) return;

    try {
      const inquiries = await fetchInquiries();
      const safe = Array.isArray(inquiries) ? inquiries : [];

      if (safe.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No recent inquiries</td></tr>`;
        return;
      }

      const recent = safe
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8);

      tableBody.innerHTML = recent
        .map(
          (i) => `
        <tr>
          <td>${i.id ?? "—"}</td>
          <td>${i.name || "—"}</td>
          <td>${i.email || "—"}</td>
          <td>${i.subject || "—"}</td>
          <td>${
            i.message
              ? i.message.length > 50
                ? i.message.substring(0, 50) + "…"
                : i.message
              : "—"
          }</td>
          <td><span class="status ${(i.status || "Pending").toLowerCase()}">${i.status || "Pending"}</span></td>
          <td>${i.created_at ? new Date(i.created_at).toLocaleString() : "—"}</td>
        </tr>
      `
        )
        .join("");
    } catch (err) {
      console.error("Error loading recent inquiries:", err);
      tableBody.innerHTML = `<tr><td colspan="8" style="color:red;">Error loading recent inquiries</td></tr>`;
    }
  }

  // -----------------------------
  // View All button
  // -----------------------------
  const viewAllBtn = document.getElementById("viewAllBtn");
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      window.location.href = "inquiries.html";
    });
  }

  // -----------------------------
  // Dropdown handler
  // -----------------------------
  if (inquiriesPeriodSelect) {
    inquiriesPeriodSelect.addEventListener("change", async (e) => {
      const period = e.target.value;
      await loadDashboardInquiries(period);
    });
  }

  // -----------------------------
  // Initial Load
  // -----------------------------
  await loadKPIs();
  await loadDashboardInquiries("month");
  await loadRecentUpdates();
  await loadRecentInquiries();
});
