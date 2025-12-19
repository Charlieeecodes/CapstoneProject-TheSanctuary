document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Determine default redirect based on current page
  const currentPage = window.location.pathname;
  let defaultRedirect = '/inquiry.html';
  if (currentPage.includes('feedback.html')) defaultRedirect = '/feedback.html';

  // Check for query param override
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPage = urlParams.get('redirect') || defaultRedirect;

  // Auto-redirect if already logged in
  if (user && user.token) {
    window.location.href = redirectPage;
  }

  // Handle login form submission
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const msgEl = document.getElementById('loginMessage');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify({ ...data.user, token: data.token }));
        msgEl.textContent = '✅ Login successful! Redirecting...';
        msgEl.style.color = 'green';
        window.location.href = redirectPage; // use the computed redirect
      } else {
        msgEl.textContent = data.message || 'Login failed';
        msgEl.style.color = 'red';
      }
    } catch (err) {
      console.error(err);
      msgEl.textContent = 'Server error. Try again.';
      msgEl.style.color = 'red';
    }
  });
});
