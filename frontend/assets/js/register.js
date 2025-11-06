// /frontend/assets/register.js

const registerForm = document.getElementById('registerForm');
const verifyForm = document.getElementById('verifyForm');
const regMessage = document.getElementById('regMessage');
const verifyMessage = document.getElementById('verifyMessage');
const resendBtn = document.getElementById('resendCode');
const passwordInput = document.getElementById('regPassword');
const showPassword = document.getElementById('showPassword');

// -----------------------------
// Show/hide password toggle
// -----------------------------
showPassword?.addEventListener('change', () => {
  passwordInput.type = showPassword.checked ? 'text' : 'password';
});

// -----------------------------
// Registration form submission
// -----------------------------
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = passwordInput.value.trim();

  // Client-side validation
  if (!name || !email || !password) {
    regMessage.textContent = '⚠️ Please fill in all required fields.';
    regMessage.style.color = 'orange';
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    regMessage.textContent = '⚠️ Please enter a valid email address.';
    regMessage.style.color = 'orange';
    return;
  }

  if (password.length < 8) {
    regMessage.textContent = '⚠️ Password must be at least 8 characters.';
    regMessage.style.color = 'orange';
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    regMessage.textContent = data.message;
    regMessage.style.color = data.success ? 'green' : 'red';

    if (data.success) {
      // Show verification form and resend button
      verifyForm.style.display = 'block';
      registerForm.style.display = 'none';
      resendBtn.style.display = 'inline-block';
      document.getElementById('verifyEmail').value = email; // pre-fill email
    }
  } catch (err) {
    console.error(err);
    regMessage.textContent = 'Server error. Try again.';
    regMessage.style.color = 'red';
  }
});

// -----------------------------
// Verification form submission
// -----------------------------
verifyForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('verifyEmail').value.trim();
  const code = document.getElementById('verifyCode').value.trim();

  if (!code) {
    verifyMessage.textContent = '⚠️ Please enter the verification code.';
    verifyMessage.style.color = 'orange';
    return;
  }

  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json();
    verifyMessage.textContent = data.message;
    verifyMessage.style.color = data.success ? 'green' : 'red';

    if (data.success) {
      setTimeout(() => window.location.href = '/login.html', 1500);
    }
  } catch (err) {
    console.error(err);
    verifyMessage.textContent = 'Server error. Try again.';
    verifyMessage.style.color = 'red';
  }
});

// -----------------------------
// Resend verification code
// -----------------------------
resendBtn?.addEventListener('click', async () => {
  const email = document.getElementById('verifyEmail').value.trim();
  if (!email) return;

  try {
    const res = await fetch('/api/auth/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    verifyMessage.textContent = data.message;
    verifyMessage.style.color = data.success ? 'green' : 'red';
  } catch (err) {
    console.error(err);
    verifyMessage.textContent = 'Server error. Try again.';
    verifyMessage.style.color = 'red';
  }
});
