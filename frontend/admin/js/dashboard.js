document.addEventListener('DOMContentLoaded', async () => {
  console.log('📊 [Dashboard] Page Loaded');

  // -----------------------------
  // Element references
  // -----------------------------
  const totalInquiriesEl = document.getElementById('totalInquiries');
  const inquiryGrowthEl = document.getElementById('inquiryGrowth');
  const totalFeedbacksEl = document.querySelector('.stat-card:nth-child(2) .value');
  const totalServicesEl = document.querySelector('.stat-card:nth-child(3) .value');
  const topServiceEl = document.querySelector('.stat-card:nth-child(3) strong');
  const tableBody = document.querySelector('#inquiryTable tbody');
  const recentUpdatesContainer = document.getElementById('recentUpdates');
  const inquiriesPeriodSelect = document.getElementById('inquiriesPeriod');

  // -----------------------------
  // Fetch data helpers
  // -----------------------------
  async function fetchInquiries() {
    const res = await fetch('http://localhost:5000/api/inquiries');
    return await res.json();
  }

  async function fetchFeedbacks() {
    const res = await fetch('http://localhost:5000/api/feedbacks');
    return await res.json();
  }

  async function fetchInquiriesByPeriod(period) {
    const url = `http://localhost:5000/api/analytics/inquiries?period=${encodeURIComponent(period)}&mode=summary`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      return json;
    } catch (err) {
      console.error('[dashboard] fetchInquiriesByPeriod error:', err);
      return { total: 0 };
    }
  }

  // -----------------------------
  // Load KPIs (from /api/analytics/kpis)
  // -----------------------------
  async function loadKPIs() {
    try {
      const res = await fetch('http://localhost:5000/api/analytics/kpis');
      if (!res.ok) throw new Error('Failed to fetch KPIs');
      const data = await res.json();

      // Update KPI values
      if (totalInquiriesEl) totalInquiriesEl.textContent = data.totalInquiries ?? 0;
      if (totalFeedbacksEl) totalFeedbacksEl.textContent = data.totalFeedbacks ?? 0;
      if (totalServicesEl) totalServicesEl.textContent = data.totalServices ?? 0;
      if (topServiceEl) topServiceEl.textContent = `Top Services Availed: ${data.topService ?? 'N/A'}`;
    } catch (err) {
      console.error('❌ Error loading KPIs:', err);
    }
  }

  // -----------------------------
  // Inquiries growth tracking
  // -----------------------------
  async function loadDashboardInquiries(period = 'month') {
    try {
      const data = await fetchInquiriesByPeriod(period);
      const total = Number(data.total) || 0;
      totalInquiriesEl.textContent = total;

      const lastValue = parseInt(localStorage.getItem(`lastInquiries_${period}`)) || 0;
      const growth = lastValue ? (((total - lastValue) / lastValue) * 100).toFixed(1) : 0;
      inquiryGrowthEl.textContent = `${growth >= 0 ? '+' : ''}${growth}%`;
      localStorage.setItem(`lastInquiries_${period}`, total);
    } catch (err) {
      console.error('[dashboard] loadDashboardInquiries error:', err);
      totalInquiriesEl.textContent = 'Error';
    }
  }

  // -----------------------------
  // Load recent updates (Inquiries + Feedbacks)
  // -----------------------------
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

  // -----------------------------
  // Load recent inquiries table
  // -----------------------------
  async function loadRecentInquiries() {
    try {
      const inquiries = await fetchInquiries();
      if (!Array.isArray(inquiries) || inquiries.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No recent inquiries</td></tr>`;
        return;
      }

      const recent = inquiries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
      tableBody.innerHTML = recent.map(i => `
        <tr>
          <td>${i.id}</td>
          <td>${i.name || '—'}</td>
          <td>${i.email || '—'}</td>
          <td>${i.subject || '—'}</td>
          <td>${i.message ? (i.message.length > 50 ? i.message.substring(0, 50) + '…' : i.message) : '—'}</td>
          <td><span class="status ${i.status?.toLowerCase() || 'pending'}">${i.status || 'Pending'}</span></td>
          <td>${new Date(i.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading recent inquiries:', err);
      tableBody.innerHTML = `<tr><td colspan="8" style="color:red;">Error loading recent inquiries</td></tr>`;
    }
  }

  // -----------------------------
  // Dropdown handler
  // -----------------------------
  if (inquiriesPeriodSelect) {
    inquiriesPeriodSelect.addEventListener('change', async (e) => {
      const period = e.target.value;
      await loadDashboardInquiries(period);
    });
  }

  // -----------------------------
  // Initial Load
  // -----------------------------
  await loadKPIs();
  await loadDashboardInquiries('month');
  await loadRecentUpdates();
  await loadRecentInquiries();
});
