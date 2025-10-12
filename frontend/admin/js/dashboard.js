document.addEventListener('DOMContentLoaded', async () => {
  const totalEl = document.getElementById('totalInquiries');
  const growthEl = document.getElementById('inquiryGrowth');
  const tableBody = document.querySelector('#inquiryTable tbody');

  try {
    const res = await fetch('http://localhost:5000/api/inquiries');
    const data = await res.json();

    // Update total inquiries card
    totalEl.textContent = data.length;

    // OPTIONAL: Example of a simple growth formula (customize as needed)
    // Assuming we get data growth since last month from localStorage or API
    const lastMonthCount = parseInt(localStorage.getItem('lastMonthInquiries')) || 0;
    const growth = lastMonthCount ? (((data.length - lastMonthCount) / lastMonthCount) * 100).toFixed(1) : 0;
    growthEl.textContent = `${growth >= 0 ? '+' : ''}${growth}%`;
    localStorage.setItem('lastMonthInquiries', data.length);

    // Populate recent inquiries table (show latest 5)
    const recent = data.slice(-5).reverse();
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
  } catch (err) {
    console.error('Error loading inquiries:', err);
    totalEl.textContent = 'Error';
    tableBody.innerHTML = `<tr><td colspan="6">Error loading inquiries.</td></tr>`;
  }
});
