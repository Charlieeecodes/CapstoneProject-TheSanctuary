document.addEventListener("DOMContentLoaded", () => {
  const navMenu = document.getElementById('navMenu');
  const heroTitle = document.getElementById('heroTitle');      // may exist only on home
  const heroButtons = document.getElementById('heroButtons');  // may exist only on home
  
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {}

  const isLogged = user && user.token;

  // ============================
  // NAVBAR
  // ============================
  if (isLogged) {
    navMenu.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="services.html">Services</a></li>
      <li><a href="gallery.html">Gallery</a></li>
      <li><a href="index.html#aboutSection">About Us</a></li>
      <li><a href="inquiry.html">Submit Inquiry</a></li>
      <li><a href="feedback.html">Feedback</a></li>
      <li><a href="profile.html">My Profile</a></li>
      <li><a href="#" id="logoutBtn">Logout</a></li>
    `;

    if (heroTitle) {
      heroTitle.innerHTML = `Welcome, <span style="color:#ffd700">${user.name}</span>`;
    }

  } else {
    navMenu.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="services.html">Services</a></li>
      <li><a href="gallery.html">Gallery</a></li>
      <li><a href="index.html#aboutSection">About Us</a></li>
      <li><a href="inquiry.html">Submit Inquiry</a></li>
      <li><a href="feedback.html">Feedback</a></li>
      <li><a href="login.html">Login</a></li>
    `;
  }

  // ============================
  // LOGOUT (all pages)
  // ============================
  setTimeout(() => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = "index.html";
      });
    }
  }, 50);

  // ============================
  // HOMEPAGE-SPECIFIC LOGIC
  // ============================
  const servicesSection = document.getElementById('servicesSection');
  const gallerySection  = document.getElementById('gallerySection');
  const aboutSection    = document.getElementById('aboutSection');

  // If not on home page, skip the rest
  if (!servicesSection || !gallerySection || !aboutSection) return;

  // ----------------------------
  // Guest vs Logged-in notes
  // ----------------------------
  // Services: guest-only note visibility
  document.querySelectorAll(".guest-only-note").forEach(note => {
    note.style.display = isLogged ? "none" : "block";
  });

  // Gallery: guest note visibility
  const guestGalleryNote = document.querySelector(".guest-gallery-note");
  if (guestGalleryNote) {
    guestGalleryNote.style.display = isLogged ? "none" : "block";
  }

  const scrollToSection = (idOrEl) => {
    let el = idOrEl;
    if (typeof idOrEl === "string") {
      el = document.getElementById(idOrEl);
    }
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // ----------------------------
  // VIEW MORE BUTTONS (Services)
  // ----------------------------
  document.querySelectorAll(".view-more-service").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (isLogged) {
        // Logged-in → go to full Services page
        window.location.href = "services.html";
      } else {
        // Guest → scroll to the guest note inside Services section
        const note = servicesSection.querySelector(".guest-only-note");
        scrollToSection(note || servicesSection);
      }
    });
  });

  // ----------------------------
  // VIEW MORE BUTTON (Gallery)
  // ----------------------------
  const viewMoreGalleryBtn = document.querySelector(".view-more-gallery");
  if (viewMoreGalleryBtn) {
    viewMoreGalleryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (isLogged) {
        // Logged-in → go to full Gallery page
        window.location.href = "gallery.html";
      } else {
        // Guest → scroll to gallery section / note
        scrollToSection(guestGalleryNote || gallerySection);
      }
    });
  }

  // ----------------------------
  // Hero buttons click behavior
  // ----------------------------
  if (heroButtons) {
    heroButtons.querySelectorAll('[data-link="services"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isLogged) {
          window.location.href = 'services.html';
        } else {
          scrollToSection('servicesSection');
        }
      });
    });

    heroButtons.querySelectorAll('[data-link="about"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection('aboutSection');
      });
    });
  }

  // ----------------------------
  // Navbar Services & Gallery behavior for guests (on Home)
  // ----------------------------
  setTimeout(() => {
    if (!isLogged) {
      const servicesLink = document.querySelector('a[href="services.html"]');
      const galleryLink  = document.querySelector('a[href="gallery.html"]');

      if (servicesLink) {
        servicesLink.addEventListener('click', (e) => {
          e.preventDefault();
          scrollToSection('servicesSection');
        });
      }

      if (galleryLink) {
        galleryLink.addEventListener('click', (e) => {
          e.preventDefault();
          scrollToSection('gallerySection');
        });
      }
    }
  }, 150);
});
