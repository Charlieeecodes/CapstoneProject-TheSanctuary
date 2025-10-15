document.getElementById('inquiryForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();

  const responseMessage = document.getElementById('responseMessage');
  responseMessage.textContent = "Sending inquiry...";

  try {
    const res = await fetch('http://localhost:5000/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });

    const data = await res.json();

    if (data.success) {
      responseMessage.textContent = "Inquiry submitted successfully";
      document.getElementById('inquiryForm').reset();
    } else {
      responseMessage.textContent = "Failed to submit inquiry. Please try again.";
    }
  } catch (error) {
    console.error("Error:", error);
    responseMessage.textContent = "Server error. Please try again later.";
  }
});

