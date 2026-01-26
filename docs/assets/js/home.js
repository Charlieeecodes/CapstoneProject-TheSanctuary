document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // NAVBAR
  // -------------------------
  const navMenu = document.getElementById("navMenu");

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user")); } catch {}
  const isLogged = user && user.token;

  if (navMenu) {
    if (isLogged) {
      navMenu.innerHTML = `
        <li><a href="index.html">Home</a></li>
        <li><a href="services.html">Services</a></li>
        <li><a href="gallery.html">Gallery</a></li>
        <li><a href="index.html#aboutSection">About Us</a></li>
        <li><a href="feedback.html">Feedback</a></li>
        <li><a href="#" id="logoutBtn">Logout</a></li>
      `;
    } else {
      navMenu.innerHTML = `
        <li><a href="index.html">Home</a></li>
        <li><a href="services.html">Services</a></li>
        <li><a href="gallery.html">Gallery</a></li>
        <li><a href="index.html#aboutSection">About Us</a></li>
        <li><a href="feedback.html">Feedback</a></li>
        <li><a href="login.html">Login</a></li>
      `;
    }
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }

  // -------------------------
  // HOMEPAGE-SPECIFIC LOGIC
  // -------------------------
  const servicesSection = document.getElementById("servicesSection");
  const gallerySection  = document.getElementById("gallerySection");
  const aboutSection    = document.getElementById("aboutSection");

  const heroButtons = document.getElementById("heroButtons");

  const scrollToSection = (idOrEl) => {
    let el = idOrEl;
    if (typeof idOrEl === "string") el = document.getElementById(idOrEl);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (servicesSection && gallerySection && aboutSection) {
    // Guest notes
    document.querySelectorAll(".guest-only-note").forEach(note => {
      note.style.display = isLogged ? "none" : "block";
    });

    const guestGalleryNote = document.querySelector(".guest-gallery-note");
    if (guestGalleryNote) guestGalleryNote.style.display = isLogged ? "none" : "block";

    // View more services
    document.querySelectorAll(".view-more-service").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (isLogged) window.location.href = "services.html";
        else scrollToSection(servicesSection.querySelector(".guest-only-note") || servicesSection);
      });
    });

    // View more gallery
    const viewMoreGalleryBtn = document.querySelector(".view-more-gallery");
    if (viewMoreGalleryBtn) {
      viewMoreGalleryBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (isLogged) window.location.href = "gallery.html";
        else return; // your original behavior
      });
    }

    // Hero buttons
    if (heroButtons) {
      heroButtons.querySelectorAll('[data-link="services"]').forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          if (isLogged) window.location.href = "services.html";
          else scrollToSection("servicesSection");
        });
      });

      heroButtons.querySelectorAll('[data-link="about"]').forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          scrollToSection("aboutSection");
        });
      });
    }

    // Navbar Services & Gallery behavior for guests
    if (!isLogged) {
      const servicesLink = document.querySelector('a[href="services.html"]');
      const galleryLink  = document.querySelector('a[href="gallery.html"]');

      if (servicesLink) {
        servicesLink.addEventListener("click", (e) => {
          e.preventDefault();
          scrollToSection("servicesSection");
        });
      }

      if (galleryLink) {
        galleryLink.addEventListener("click", (e) => {
          e.preventDefault();
          scrollToSection("gallerySection");
        });
      }
    }
  }

  // -------------------------
  // GALLERY SLIDER (guarded)
  // -------------------------
  const slider = document.getElementById("gallerySlider");
  const prevBtn = document.querySelector(".left-btn");
  const nextBtn = document.querySelector(".right-btn");

  if (slider && prevBtn && nextBtn) {
    let slides = Array.from(slider.children);
    const visibleCount = 3;

    const firstClones = slides.slice(0, visibleCount).map(s => s.cloneNode(true));
    const lastClones  = slides.slice(-visibleCount).map(s => s.cloneNode(true));

    firstClones.forEach(c => c.setAttribute("data-clone", "first"));
    lastClones.forEach(c => c.setAttribute("data-clone", "last"));

    firstClones.forEach(c => slider.appendChild(c));
    lastClones.forEach(c => slider.insertBefore(c, slides[0]));

    slides = Array.from(slider.children);

    let index = visibleCount;
    let slideWidth = slides[index].clientWidth;

    slider.style.transform = `translateX(${-slideWidth * index}px)`;

    window.addEventListener("resize", () => {
      slideWidth = slides[index].clientWidth;
      slider.style.transition = "none";
      slider.style.transform = `translateX(${-slideWidth * index}px)`;
    });

    let transitioning = false;

    nextBtn.addEventListener("click", () => {
      if (transitioning) return;
      transitioning = true;
      index++;
      slider.style.transition = "transform 0.4s ease";
      slider.style.transform = `translateX(${-slideWidth * index}px)`;
    });

    prevBtn.addEventListener("click", () => {
      if (transitioning) return;
      transitioning = true;
      index--;
      slider.style.transition = "transform 0.4s ease";
      slider.style.transform = `translateX(${-slideWidth * index}px)`;
    });

    slider.addEventListener("transitionend", () => {
      transitioning = false;

      if (slides[index]?.dataset.clone === "first") {
        slider.style.transition = "none";
        index = visibleCount;
        slider.style.transform = `translateX(${-slideWidth * index}px)`;
      }

      if (slides[index]?.dataset.clone === "last") {
        slider.style.transition = "none";
        index = slides.length - visibleCount * 2;
        slider.style.transform = `translateX(${-slideWidth * index}px)`;
      }
    });
  }
});
