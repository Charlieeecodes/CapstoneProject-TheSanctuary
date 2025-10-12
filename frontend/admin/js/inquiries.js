document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.querySelector('#inquiryTable tbody');

  // Load inquiries from backend
  async function loadInquiries() {
    try {
      const res = await fetch('http://localhost:5000/api/inquiries');
      const data = await res.json();

      tableBody.innerHTML = data.map(inquiry => `
        <tr>
          <td>${inquiry.id}</td>
          <td>${inquiry.name}</td>
          <td>${inquiry.email}</td>
          <td>${inquiry.subject}</td>
          <td>${inquiry.message}</td>
          <td>
            <select class="statusSelect" data-id="${inquiry.id}">
              <option value="Pending" ${inquiry.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${inquiry.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${inquiry.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </td>
          <td><button class="deleteBtn" data-id="${inquiry.id}">🗑️ Delete</button></td>
          <td>${new Date(inquiry.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error fetching inquiries:', err);
    }
  }

  await loadInquiries();

  // Handle status changes
  tableBody.addEventListener('change', async (e) => {
    if (e.target.classList.contains('statusSelect')) {
      const id = e.target.dataset.id;
      const status = e.target.value;
      await fetch(`http://localhost:5000/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      alert('Status updated!');
    }
  });

  // Handle delete
  tableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('deleteBtn')) {
      const id = e.target.dataset.id;
      if (confirm('Delete this inquiry?')) {
        await fetch(`http://localhost:5000/api/inquiries/${id}`, { method: 'DELETE' });
        alert('Inquiry deleted!');
        loadInquiries();
      }
    }
  });
});
