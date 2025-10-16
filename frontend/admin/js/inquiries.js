document.addEventListener('DOMContentLoaded', async () => {
  const sidebarContainer = document.querySelector('.inquiries-container');
  const detailPanel = document.getElementById('inquiry-full-content');

  // Fetch all inquiries from backend
  async function fetchInquiries() {
    try {
      const res = await fetch('http://localhost:5000/api/inquiries');
      return await res.json();
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      return [];
    }
  }

  // Load inquiries into sidebar
  async function loadInquiries() {
    try {
      const data = await fetchInquiries();

      // Populate sidebar cards (latest first)
      sidebarContainer.innerHTML = data.reverse().map(inquiry => `
        <div class="inquiry-card" data-id="${inquiry.id}">
          <div>
            <p><strong>ID:</strong> ${inquiry.id}</p>
            <p><strong>Name:</strong> ${inquiry.name}</p>
            <p><strong>Subject:</strong> ${inquiry.subject}</p>
            <p><small>${new Date(inquiry.created_at).toLocaleString()}</small></p>
          </div>
          <div>
            <button class="view-btn" data-id="${inquiry.id}">View</button>
          </div>
        </div>
      `).join('');

      attachCardEvents(data);

    } catch (err) {
      console.error('Error loading inquiries:', err);
      sidebarContainer.innerHTML = `<p style="color:red;">Error loading inquiries.</p>`;
    }
  }

  // Attach click events to sidebar cards
  function attachCardEvents(inquiries) {
    document.querySelectorAll('.view-btn').forEach(button => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.id);
        const inquiry = inquiries.find(i => i.id === id);
        if (!inquiry) return;

        // Render detail panel
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
              <option value="Pending" ${inquiry.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${inquiry.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${inquiry.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </p>
          <p><strong>Date:</strong> ${new Date(inquiry.created_at).toLocaleString()}</p>
          <button id="deleteBtn" class="delete-btn">🗑️ Delete Inquiry</button>
          <hr>
          <div class="send-message-form">
            <h4>Send a Response</h4>
            <p><strong>To:</strong> <span id="recipientEmail">${inquiry.email}</span></p>
            <textarea id="responseMessage" placeholder="Write your message here..." rows="5" style="width:100%;"></textarea>
            <button id="sendMessageBtn">Send Message</button>
          </div>
        `;

        // Handle status update
        document.getElementById('statusSelect').addEventListener('change', async (e) => {
          const newStatus = e.target.value;
          try {
            await fetch(`http://localhost:5000/api/inquiries/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus })
            });
            alert('Status updated successfully!');
            await loadInquiries();
            notifyDashboardUpdate();
          } catch (err) {
            console.error('Failed to update status:', err);
          }
        });

        // Handle delete
        document.getElementById('deleteBtn').addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this inquiry?')) {
            try {
              const res = await fetch(`http://localhost:5000/api/inquiries/${id}`, { method: 'DELETE' });
              const result = await res.json();
              if (res.ok) {
                alert('Inquiry deleted successfully!');
                detailPanel.innerHTML = `<p>Select an inquiry from the left to view details.</p>`;
                await loadInquiries();
                notifyDashboardUpdate();
              } else {
                alert('Failed to delete inquiry: ' + result.message);
              }
            } catch (err) {
              console.error('Delete failed:', err);
            }
          }
        });

        // Handle send message
        document.getElementById('sendMessageBtn').addEventListener('click', async () => {
          const recipient = document.getElementById('recipientEmail').textContent;
          const message = document.getElementById('responseMessage').value.trim();
          if (!message) {
            alert('Please enter a message before sending.');
            return;
          }
          try {
            const res = await fetch('http://localhost:5000/api/inquiries/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: recipient, message, inquiryId: id })
            });
            const result = await res.json();
            if (res.ok) {
              alert('Message sent successfully!');
              document.getElementById('responseMessage').value = '';
            } else {
              alert('Failed to send message: ' + result.message);
            }
          } catch (err) {
            console.error('Error sending message:', err);
            alert('Error sending message.');
          }
        });
      });
    });
  }

  // Notify dashboard to refresh if inquiries change
  function notifyDashboardUpdate() {
    localStorage.setItem('dashboardNeedsRefresh', 'true');
  }

  // Initial load
  await loadInquiries();
});
