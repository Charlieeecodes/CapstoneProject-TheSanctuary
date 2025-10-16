document.addEventListener('DOMContentLoaded', async () => {
  const totalEl = document.getElementById('totalInquiries');
  const growthEl = document.getElementById('inquiryGrowth');
  const tableBody = document.querySelector('#inquiryTable tbody');

  try {
    // Use shared fetch function
    const data = await fetchInquiries();

    // Update total inquiries card
    totalEl.textContent = data.length;

    // Simple growth calculation
    const lastMonthCount = parseInt(localStorage.getItem('lastMonthInquiries')) || 0;
    const growth = lastMonthCount
      ? (((data.length - lastMonthCount) / lastMonthCount) * 100).toFixed(1)
      : 0;
    growthEl.textContent = `${growth >= 0 ? '+' : ''}${growth}%`;
    localStorage.setItem('lastMonthInquiries', data.length);

    // Populate recent inquiries table (latest 5)
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
  // Redirect to full Inquiries page
document.getElementById('viewAllBtn').addEventListener('click', () => {
  window.location.href = 'inquiries.html';
});
// 🔥 Refresh dashboard data if inquiries changed elsewhere
window.addEventListener('focus', async () => {
  if (localStorage.getItem('dashboardNeedsRefresh') === 'true') {
    await loadDashboardInquiries(); // call your existing load function
    localStorage.removeItem('dashboardNeedsRefresh');
  }
});

});
