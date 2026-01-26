(function () {
  if (window.__inqWidgetMounted) return;
  window.__inqWidgetMounted = true;

  const SITE_KEY = "6LefkAMsAAAAALC_8WTkOdzlktlJY-REbiaMQhnt"; // your sitekey

  // -----------------------------
  // Helpers: match your system
  // -----------------------------
  const getCurrentUser = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (!u) return null;
      const token = u.token || u.accessToken || u.jwt || u.authToken;
      if (!token) return null;
      return { ...u, token };
    } catch {
      return null;
    }
  };

  const isLoggedIn = () => !!getCurrentUser();

  // -----------------------------
  // Widget HTML (FULL FORM INSIDE)
  // -----------------------------
  const widgetHTML = `
    <div class="inq-fab" id="inqFab" aria-label="Open inquiry">
      <span class="inq-fab-icon">💬</span>
      <span class="inq-fab-text">Inquiry</span>
    </div>

    <div class="inq-panel" id="inqPanel" aria-hidden="true">
      <div class="inq-panel-header">
        <div class="inq-title">Need help?</div>
        <button type="button" class="inq-close" id="inqClose" aria-label="Close">✕</button>
      </div>

      <div class="inq-screen" id="inqScreenA">
        <div class="inq-bubble">Hi! 👋 Send us your inquiry below.</div>
        <div class="inq-actions">
          <button type="button" class="inq-btn primary" id="inqGoSend">📩 Send an Inquiry</button>
        </div>
        <div class="inq-hint" id="inqHint"></div>
      </div>

      <div class="inq-screen hidden" id="inqScreenB">
        <form id="inqMiniForm" class="inq-form">
          <div id="inqGuestFields" class="inq-guest-fields">
            <label for="inqName">Full Name</label>
            <input type="text" id="inqName" name="name" placeholder="Enter your name" />

            <label for="inqEmail">Email</label>
            <input type="email" id="inqEmail" name="email" placeholder="Enter your email" />
          </div>

          <label for="inqSubject">Subject</label>
          <input type="text" id="inqSubject" name="subject" placeholder="Enter subject" required />

          <label for="inqMessage">Message</label>
          <textarea id="inqMessage" name="message" rows="3" placeholder="Write your message..." required></textarea>

          <div class="inq-captcha-wrap">
            <div id="inqCaptcha"></div>
          </div>

          <p id="inqMiniStatus" class="inq-hint small" style="margin-top:10px;"></p>

          <div class="inq-actions-row">
            <button type="button" class="inq-btn" id="inqBack">← Back</button>
            <button type="submit" class="inq-btn primary" id="inqSubmitBtn">Send</button>
          </div>

          <div class="inq-hint small" id="inqFooterHint"></div>
        </form>
      </div>
    </div>

    <div class="inq-overlay hidden" id="inqOverlay"></div>
  `;

  // Ensure body exists (safe)
  const mount = () => document.body.insertAdjacentHTML("beforeend", widgetHTML);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  // -----------------------------
  // Elements
  // -----------------------------
  const fab = document.getElementById("inqFab");
  const panel = document.getElementById("inqPanel");
  const overlay = document.getElementById("inqOverlay");
  const closeBtn = document.getElementById("inqClose");

  const screenA = document.getElementById("inqScreenA");
  const screenB = document.getElementById("inqScreenB");
  const goSend = document.getElementById("inqGoSend");
  const backBtn = document.getElementById("inqBack");

  const hintEl = document.getElementById("inqHint");
  const footerHintEl = document.getElementById("inqFooterHint");

  const guestFieldsWrap = document.getElementById("inqGuestFields");
  const nameEl = document.getElementById("inqName");
  const emailEl = document.getElementById("inqEmail");

  const form = document.getElementById("inqMiniForm");
  const subjectEl = document.getElementById("inqSubject");
  const messageEl = document.getElementById("inqMessage");
  const statusEl = document.getElementById("inqMiniStatus");
  const submitBtn = document.getElementById("inqSubmitBtn");

  // -----------------------------
  // reCAPTCHA state
  // -----------------------------
  let captchaWidgetId = null;
  let captchaRendered = false;

  function renderCaptchaIfNeeded() {
    // reCAPTCHA script must be loaded globally
    if (captchaRendered) return;
    if (typeof grecaptcha === "undefined" || !grecaptcha.render) {
      if (statusEl) {
        statusEl.textContent = "⚠️ reCAPTCHA is not loaded. Please refresh the page.";
        statusEl.style.color = "orange";
      }
      return;
    }

    try {
      captchaWidgetId = grecaptcha.render("inqCaptcha", { sitekey: SITE_KEY });
      captchaRendered = true;
    } catch (e) {
      console.error("Captcha render failed:", e);
    }
  }

  function resetCaptcha() {
    try {
      if (typeof grecaptcha !== "undefined" && grecaptcha.reset && captchaRendered) {
        grecaptcha.reset(captchaWidgetId);
      }
    } catch {}
  }

  function getCaptchaResponse() {
    try {
      if (typeof grecaptcha !== "undefined" && grecaptcha.getResponse && captchaRendered) {
        return grecaptcha.getResponse(captchaWidgetId);
      }
    } catch {}
    return "";
  }

  // -----------------------------
  // UI based on login state
  // -----------------------------
  function refreshHints() {
    const user = getCurrentUser();

    if (user) {
      if (hintEl) hintEl.textContent = `🔒 Logged in as ${user.name || "User"}`;
      if (footerHintEl) footerHintEl.textContent = "Please complete reCAPTCHA then click Send.";
      if (guestFieldsWrap) guestFieldsWrap.style.display = "none";
      if (nameEl) nameEl.required = false;
      if (emailEl) emailEl.required = false;
    } else {
      if (hintEl) hintEl.textContent = "👤 You are submitting as a Guest";
      if (footerHintEl) footerHintEl.textContent = "Please complete all fields and reCAPTCHA then click Send.";
      if (guestFieldsWrap) guestFieldsWrap.style.display = "block";
      if (nameEl) nameEl.required = true;
      if (emailEl) emailEl.required = true;
    }
  }

  // -----------------------------
  // Panel behavior
  // -----------------------------
  function openPanel() {
    refreshHints();
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    overlay.classList.remove("hidden");
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    overlay.classList.add("hidden");
    screenA.classList.remove("hidden");
    screenB.classList.add("hidden");
    if (statusEl) statusEl.textContent = "";
    if (submitBtn) submitBtn.disabled = false;
    resetCaptcha();
  }

  function showScreenB() {
    refreshHints();
    screenA.classList.add("hidden");
    screenB.classList.remove("hidden");
    // Render captcha when screen is visible
    setTimeout(renderCaptchaIfNeeded, 0);
    subjectEl?.focus();
  }

  function showScreenA() {
    screenB.classList.add("hidden");
    screenA.classList.remove("hidden");
    if (statusEl) statusEl.textContent = "";
    resetCaptcha();
  }

  // -----------------------------
  // Events
  // -----------------------------
  fab.addEventListener("click", openPanel);
  overlay.addEventListener("click", closePanel);
  closeBtn.addEventListener("click", closePanel);

  goSend.addEventListener("click", showScreenB);
  backBtn.addEventListener("click", showScreenA);

  // Submit inside widget (NO REDIRECT)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = getCurrentUser();

    const name = user ? (user.name || "") : (nameEl?.value || "").trim();
    const email = user ? (user.email || "") : (emailEl?.value || "").trim();
    const subject = (subjectEl.value || "").trim();
    const message = (messageEl.value || "").trim();

    if (!subject || !message || (!user && (!name || !email))) {
      if (statusEl) {
        statusEl.textContent = "⚠️ Please fill in all required fields.";
        statusEl.style.color = "orange";
      }
      return;
    }

    const recaptchaToken = getCaptchaResponse();
    if (!recaptchaToken) {
      if (statusEl) {
        statusEl.textContent = "⚠️ Please complete the reCAPTCHA.";
        statusEl.style.color = "orange";
      }
      return;
    }

    try {
      if (submitBtn) submitBtn.disabled = true;
      if (statusEl) {
        statusEl.textContent = "⏳ Sending inquiry...";
        statusEl.style.color = "gray";
      }

      const payload = {
        name,
        email,
        subject,
        message,
        recaptchaToken,
        userId: user ? (user.id || null) : null
      };

      const res = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user && user.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        if (statusEl) {
          statusEl.textContent = "✅ Inquiry submitted successfully!";
          statusEl.style.color = "green";
        }
        form.reset();
        resetCaptcha();
        setTimeout(() => closePanel(), 900);
      } else {
        if (statusEl) {
          statusEl.textContent = data.message || "⚠️ Failed to submit inquiry. Please try again.";
          statusEl.style.color = "orange";
        }
        if (submitBtn) submitBtn.disabled = false;
        resetCaptcha();
      }
    } catch (err) {
      console.error("❌ Widget submit error:", err);
      if (statusEl) {
        statusEl.textContent = "🚨 Server error. Please try again later.";
        statusEl.style.color = "red";
      }
      if (submitBtn) submitBtn.disabled = false;
      resetCaptcha();
    }
  });
})();
