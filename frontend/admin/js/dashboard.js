document.addEventListener('DOMContentLoaded', async () => {
  const totalEl = document.getElementById('totalInquiries');
  const growthEl = document.getElementById('inquiryGrowth');
  const tableBody = document.querySelector('#inquiryTable tbody');
  const recentUpdatesContainer = document.getElementById('recentUpdates');
  const inquiriesPeriodSelect = document.getElementById('inquiriesPeriod'); // ✅ dropdown

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
  // Fetch filtered inquiries count
  // ----------------------------
  async function fetchInquiriesByPeriod(period) {
    const res = await fetch(`http://localhost:5000/api/analytics/inquiries?period=${period}&mode=summary`);
    return await res.json();
  }

  // ----------------------------
  // Load inquiries into dashboard
  // ----------------------------
  async function loadDashboardInquiries(period = 'month') {
    try {
      const data = await fetchInquiriesByPeriod(period);

      // ✅ Update total inquiries (from backend)
      totalEl.textContent = data.total ?? 0;

      // Mock growth calculation (you can enhance this later)
      const lastValue = parseInt(localStorage.getItem(`lastInquiries_${period}`)) || 0;
      const growth = lastValue
        ? (((data.total - lastValue) / lastValue) * 100).toFixed(1)
        : 0;
      growthEl.textContent = `${growth >= 0 ? '+' : ''}${growth}%`;
      localStorage.setItem(`lastInquiries_${period}`, data.total);

    } catch (err) {
      console.error('Error loading inquiries:', err);
      totalEl.textContent = 'Error';
    }
  }

  // ----------------------------
  // Load recent updates (Inquiries + Feedbacks)
  // ----------------------------
  async function loadRecentUpdates() {
    try {
      const [inquiries, feedbacks] = await Promise.all([fetchInquiries(), fetchFeedbacks()]);

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

      recentUpdatesContainer.innerHTML = combined.slice(0, 6).map(update => `
        <div class="update-card ${update.type.toLowerCase()}" data-type="${update.type}" data-id="${update.id}">
          <h4>${update.type}</h4>
          <p><strong>${update.name}</strong> (${update.email})</p>
          <p>${update.message}</p>
          <small>${new Date(update.date).toLocaleString()}</small>
        </div>
      `).join('');

      document.querySelectorAll('.update-card').forEach(card => {
        card.addEventListener('click', () => {
          const type = card.dataset.type;
          const id = card.dataset.id;

          if (type === 'Inquiry') {
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
  // Handle inquiries period dropdown (Month / Week / Year)
  // ----------------------------
  if (inquiriesPeriodSelect) {
    inquiriesPeriodSelect.addEventListener('change', async (e) => {
      const period = e.target.value;

      // 🔹 Update Total Inquiries KPI
      await loadDashboardInquiries(period);

      // 🔹 Update Inquiries Trend Chart (if function available)
      if (window.updateInquiriesChart) {
        window.updateInquiriesChart(period);
      }
    });

    // Auto-load current month on start
    inquiriesPeriodSelect.value = 'month';
    inquiriesPeriodSelect.dispatchEvent(new Event('change'));
  }

  // ----------------------------
  // Handle navigation + refresh
  // ----------------------------
  document.getElementById('viewAllBtn')?.addEventListener('click', () => {
    window.location.href = 'inquiries.html';
  });

  window.addEventListener('focus', async () => {
    if (localStorage.getItem('dashboardNeedsRefresh') === 'true') {
      const currentPeriod = inquiriesPeriodSelect?.value || 'month';
      await loadDashboardInquiries(currentPeriod);
      await loadRecentUpdates();
      localStorage.removeItem('dashboardNeedsRefresh');
    }
  });

  // ----------------------------
  // Initial load
  // ----------------------------
  await loadDashboardInquiries('month');
  await loadRecentUpdates();
});
