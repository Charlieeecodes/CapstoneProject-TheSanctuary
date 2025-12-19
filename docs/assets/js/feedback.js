document.addEventListener('DOMContentLoaded', () => {
  const feedbackForm = document.getElementById('feedbackForm');
  const guestFields = document.getElementById('guestFields');
  const userStatus = document.getElementById('userStatus');
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

  // -----------------------------
  // UPDATE UI BASED ON USER STATE
  // -----------------------------
  const setUserUI = (user) => {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');

    if (user && user.token) {
      // LOGGED-IN MODE
      guestFields.style.display = 'none';

      if (nameInput) {
        nameInput.value = user.name;
        nameInput.disabled = true;
        nameInput.required = false;
      }
      if (emailInput) {
        emailInput.value = user.email;
        emailInput.disabled = true;
        emailInput.required = false;
      }

      userStatus.innerHTML = `🔒 Logged in as <strong>${user.name}</strong>`;

    } else {
      // GUEST MODE
      guestFields.style.display = 'block';

      if (nameInput) {
        nameInput.value = '';
        nameInput.disabled = false;
        nameInput.required = true;
      }
      if (emailInput) {
        emailInput.value = '';
        emailInput.disabled = false;
        emailInput.required = true;
      }

      userStatus.innerHTML = '👤 You are submitting as a Guest';
    }
  };

  setUserUI(user);

  // -----------------------------
  // FEEDBACK FORM SUBMISSION
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
    // Validate ratings
    // -----------------------------
    const ratingKeys = ['overall','service','satisfaction','professionalism','communication','facility'];
    const feedbackData = { name, email, message };

    for (const key of ratingKeys) {
      const el = document.querySelector(`input[name="${key}"]:checked`);

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
    // SEND TO BACKEND
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
