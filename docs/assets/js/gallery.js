document.addEventListener("DOMContentLoaded", () => {
const galleryItems = document.querySelectorAll(".gallery-full-item img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.querySelector(".lightbox-close");
const overlay = document.querySelector(".lightbox-overlay");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.token) {
    // Guest → redirect to homepage restricted section
    window.location.href = "index.html#restrictedAccess";
  }
  // ========================================
// LIGHTBOX CLICK TO OPEN FULL IMAGE
// ========================================



// Open lightbox when image is clicked
galleryItems.forEach(img => {
  img.addEventListener("click", () => {
    lightboxImg.src = img.src;
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Disable scroll
  });
});

// Close lightbox
closeBtn.addEventListener("click", () => {
  lightbox.classList.add("hidden");
  document.body.style.overflow = "auto"; 
});

// Close when clicking the dark overlay
overlay.addEventListener("click", () => {
  lightbox.classList.add("hidden");
  document.body.style.overflow = "auto"; 
});
});

