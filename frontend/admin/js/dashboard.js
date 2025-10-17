document.addEventListener('DOMContentLoaded', async () => {
  const totalEl = document.getElementById('totalInquiries');
  const growthEl = document.getElementById('inquiryGrowth');
  const tableBody = document.querySelector('#inquiryTable tbody');
  const recentUpdatesContainer = document.getElementById('recentUpdates'); // ✅ new

  // ----------------------------
  // Fetch inquiries from backend
  // ----------------------------
  async function fetchInquiries() {
    const res = await fetch('http://localhost:5000/api/inquiries');
    return await res.json();
  }

  // ----------------------------
  // Fetch feedbacks from backend
  // ----------------------------
  async function fetchFeedbacks() {
    const res = await fetch('http://localhost:5000/api/feedbacks');
    return await res.json();
  }

  // ----------------------------
  // Load inquiries into dashboard
  // ----------------------------
  async function loadDashboardInquiries() {
    try {
      const data = await fetchInquiries();

      // Total inquiries count
      totalEl.textContent = data.length;

      // Growth rate (mock formula)
      const lastMonthCount = parseInt(localStorage.getItem('lastMonthInquiries')) || 0;
      const growth = lastMonthCount
        ? (((data.length - lastMonthCount) / lastMonthCount) * 100).toFixed(1)
        : 0;
      growthEl.textContent = `${growth >= 0 ? '+' : ''}${growth}%`;
      localStorage.setItem('lastMonthInquiries', data.length);

      // Recent inquiries (latest 5)
      const recent = data.slice(-5).reverse();
      if (recent.length > 0) {
        tableBody.innerHTML = recent.map(inquiry => `
          <tr>
            <td>${inquiry.id}</td>
            <td>${inquiry.name}</td>
            <td>${inquiry.email}</td>
            <td>${inquiry.subject}</td>
            <td>${inquiry.message}</td>
            <td>${new Date(inquiry.created_at).toLocaleString()}</td>
          </tr>
        `).join('');
      } else {
        tableBody.innerHTML = `<tr><td colspan="6">No inquiries found.</td></tr>`;
      }

    } catch (err) {
      console.error('Error loading inquiries:', err);
      totalEl.textContent = 'Error';
      tableBody.innerHTML = `<tr><td colspan="6">Error loading inquiries.</td></tr>`;
    }
  }

  // ----------------------------
  // Load recent updates (Inquiries + Feedbacks)
  // ----------------------------
async function loadRecentUpdates() {
  try {
    const [inquiries, feedbacks] = await Promise.all([
      fetchInquiries(),
      fetchFeedbacks()
    ]);

    // Merge data and sort by date (newest first)
    const combined = [
      ...inquiries.map(i => ({
        type: 'Inquiry',
        id: i.id,
        name: i.name,
        email: i.email,
        message: i.message,
        date: i.created_at
      })),
      ...feedbacks.map(f => ({
        type: 'Feedback',
        id: f.id,
        name: f.name,
        email: f.email,
        message: f.message,
        date: f.created_at
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render update cards
    recentUpdatesContainer.innerHTML = combined.slice(0, 6).map(update => `
      <div class="update-card ${update.type.toLowerCase()}" data-type="${update.type}" data-id="${update.id}">
        <h4>${update.type}</h4>
        <p><strong>${update.name}</strong> (${update.email})</p>
        <p>${update.message}</p>
        <small>${new Date(update.date).toLocaleString()}</small>
      </div>
    `).join('');

    // ✅ Add click behavior to each card
    document.querySelectorAll('.update-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const id = card.dataset.id;

        if (type === 'Inquiry') {
          // Save inquiry ID to session storage to open it on Inquiries page
          sessionStorage.setItem('selectedInquiryId', id);
          window.location.href = 'inquiries.html';
        } else if (type === 'Feedback') {
          sessionStorage.setItem('selectedFeedbackId', id);
          window.location.href = 'feedbacks.html';
        }
      });
    });

  } catch (err) {
    console.error('Error loading updates:', err);
    recentUpdatesContainer.innerHTML = `<p style="color:red;">Error loading updates.</p>`;
  }
}


  // ----------------------------
  // Handle navigation + refresh
  // ----------------------------
  document.getElementById('viewAllBtn').addEventListener('click', () => {
    window.location.href = 'inquiries.html';
  });

  window.addEventListener('focus', async () => {
    if (localStorage.getItem('dashboardNeedsRefresh') === 'true') {
      await loadDashboardInquiries();
      await loadRecentUpdates();
      localStorage.removeItem('dashboardNeedsRefresh');
    }
  });

  // ----------------------------
  // Initial load
  // ----------------------------
  await loadDashboardInquiries();
  await loadRecentUpdates();
});
