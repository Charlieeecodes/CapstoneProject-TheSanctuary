document.addEventListener('DOMContentLoaded', () => {
  const feedbackForm = document.getElementById('feedbackForm');
  const guestFields = document.getElementById('guestFields');
  const userStatus = document.getElementById('userStatus');
  const loginBtn = document.getElementById('loginBtn');
  const guestBtn = document.getElementById('guestBtn');
  const responseMessage = document.createElement('p');
  responseMessage.id = 'responseMessage';
  feedbackForm.parentNode.insertBefore(responseMessage, feedbackForm.nextSibling);

  // Helper: Get current logged-in user
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.token) return user;
    } catch {}
    return null;
  };

  const user = getCurrentUser();

  // Auto-fill and disable inputs if logged in
  if (user) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    if (nameInput) { nameInput.value = user.name; nameInput.disabled = true; }
    if (emailInput) { emailInput.value = user.email; emailInput.disabled = true; }
  }

  // Update UI based on user state
  const setUserUI = (user) => {
    if (user && user.token) {
      guestFields.style.display = 'none';
      loginBtn.style.display = 'none';
      guestBtn.style.display = 'inline-block';
      userStatus.innerHTML = `🔒 Logged in as <strong>${user.name}</strong>`;
    } else {
      guestFields.style.display = 'block';
      loginBtn.style.display = 'inline-block';
      guestBtn.style.display = 'inline-block';
      userStatus.innerHTML = '👤 Guest mode';

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      if (nameInput) nameInput.disabled = false;
      if (emailInput) emailInput.disabled = false;
    }
  };

  loginBtn?.addEventListener('click', () => window.location.href = 'login.html?redirect=feedback.html');
  guestBtn?.addEventListener('click', () => {
    localStorage.removeItem('user');
    setUserUI(null);
  });

  setUserUI(user);

  // -----------------------------
  // Feedback Form Submission
  // -----------------------------
  feedbackForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = getCurrentUser();
    const name = user ? user.name : (document.getElementById('name')?.value || '').trim();
    const email = user ? user.email : (document.getElementById('email')?.value || '').trim();
    const message = document.getElementById('message')?.value.trim();

    // Validate required fields
    if (!message || (!user && (!name || !email))) {
      responseMessage.textContent = '⚠️ Please fill in all required fields.';
      responseMessage.style.color = 'orange';
      return;
    }
    // -----------------------------
    // Validate and collect ratings
    // -----------------------------
    const ratingKeys = ['overall','service','satisfaction','professionalism','communication','facility'];
    const feedbackData = { name, email, message };

    for (const key of ratingKeys) {
      const el = document.querySelector(`input[name="${key}"]:checked`);
      console.log(`${key} element:`, el); // Debug: see which element is found

      if (!el) {
        responseMessage.textContent = `⚠️ Please select a rating for ${key}.`;
        responseMessage.style.color = 'orange';
        return;
      }

      feedbackData[key + '_rating'] = parseInt(el.value);
    }

    // Add userId if logged in
    feedbackData.userId = user ? user.id : null;

    console.log('Feedback payload:', feedbackData); 
    // -----------------------------
    // Send to server
    // -----------------------------
    try {
      const res = await fetch('/api/public/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && user.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify(feedbackData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        responseMessage.textContent = '✅ Feedback submitted successfully!';
        responseMessage.style.color = 'green';
        feedbackForm.reset();
        setUserUI(getCurrentUser());
        setTimeout(() => (responseMessage.textContent = ''), 4000);
      } else {
        responseMessage.textContent = data.message || '⚠️ Failed to submit feedback.';
        responseMessage.style.color = 'orange';
      }
    } catch (err) {
      console.error('❌ Error submitting feedback:', err);
      responseMessage.textContent = '🚨 Server error. Try again later.';
      responseMessage.style.color = 'red';
    }
  });
});
