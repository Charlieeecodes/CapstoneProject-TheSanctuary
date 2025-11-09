document.addEventListener('DOMContentLoaded', () => {
  console.log('📨 [Inquiry Page] Loaded');

  const form = document.getElementById('inquiryForm');
  const responseMessage = document.getElementById('responseMessage');
  const guestFields = document.getElementById('guestFields');
  const userStatus = document.getElementById('userStatus');
  const loginBtn = document.getElementById('loginBtn');
  const guestBtn = document.getElementById('guestBtn');

  // -----------------------------
  // Helper: Get current logged-in user
  // -----------------------------
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.token) return user;
    } catch {}
    return null;
  };

  // -----------------------------
  // Update UI based on user state
  // -----------------------------
  const setUserUI = (user) => {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const welcome = document.getElementById('welcomeMessage');

    if (user && user.token) {
      // Hide guest fields and login button
      guestFields.style.display = 'none';
      loginBtn.style.display = 'none';
      guestBtn.style.display = 'inline-block';

      // Fill name/email and disable
      if (nameInput) {
        nameInput.value = user.name;
        nameInput.required = false;
        nameInput.disabled = true;
      }
      if (emailInput) {
        emailInput.value = user.email;
        emailInput.required = false;
        emailInput.disabled = true;
      }

      // Show logged-in status & welcome
      userStatus.innerHTML = `🔒 Logged in as <strong>${user.name}</strong>`;
      if (welcome) welcome.textContent = `Welcome, ${user.name}!`;
    } else {
      // Guest mode
      guestFields.style.display = 'block';
      loginBtn.style.display = 'inline-block';
      guestBtn.style.display = 'inline-block';
      userStatus.innerHTML = '👤 Guest mode';

      if (nameInput) {
        nameInput.value = '';
        nameInput.required = true;
        nameInput.disabled = false;
      }
      if (emailInput) {
        emailInput.value = '';
        emailInput.required = true;
        emailInput.disabled = false;
      }

      if (welcome) welcome.textContent = '';
    }
  };

  // -----------------------------
  // Login / Guest button actions
  // -----------------------------
  loginBtn?.addEventListener('click', () => {
    window.location.href = `login.html?redirect=inquiry.html`;
  });
  guestBtn?.addEventListener('click', () => {
    localStorage.removeItem('user');
    setUserUI(null);
  });

  setUserUI(getCurrentUser());

  // -----------------------------
  // Form Submission
  // -----------------------------
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getCurrentUser();

    const name = user ? user.name : (document.getElementById('name')?.value || '').trim();
    const email = user ? user.email : (document.getElementById('email')?.value || '').trim();
    const subject = (document.getElementById('subject')?.value || '').trim();
    const message = (document.getElementById('message')?.value || '').trim();

    responseMessage.textContent = '⏳ Sending inquiry...';
    responseMessage.style.color = 'gray';

    if (!subject || !message || (!user && (!name || !email))) {
      responseMessage.textContent = '⚠️ Please fill in all required fields.';
      responseMessage.style.color = 'orange';
      return;
    }

    // -----------------------------
    // reCAPTCHA token
    // -----------------------------
    let recaptchaToken = '';
    try {
      if (typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
        recaptchaToken = grecaptcha.getResponse();
      }
      if (!recaptchaToken) {
        responseMessage.textContent = '⚠️ Please complete the reCAPTCHA.';
        responseMessage.style.color = 'orange';
        return;
      }
    } catch (err) {
      console.warn('reCAPTCHA not available:', err);
    }

    const payload = {
      name,
      email,
      subject,
      message,
      recaptchaToken,
      userId: user ? user.id : null
    };

    try {
      const res = await fetch('/api/public/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && user.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        responseMessage.textContent = '✅ Inquiry submitted successfully!';
        responseMessage.style.color = 'green';
        form.reset();
        if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) grecaptcha.reset();
        setUserUI(getCurrentUser());
        setTimeout(() => (responseMessage.textContent = ''), 4000);
      } else {
        responseMessage.textContent = data.message || '⚠️ Failed to submit inquiry. Please try again.';
        responseMessage.style.color = 'orange';
      }
    } catch (err) {
      console.error('❌ Error submitting inquiry:', err);
      responseMessage.textContent = '🚨 Server error. Please try again later.';
      responseMessage.style.color = 'red';
    }
  });
});
