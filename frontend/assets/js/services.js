document.addEventListener("DOMContentLoaded", () => {
  // ============================
  // ACCESS CONTROL (Logged-in Only)
  // ============================
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      // Guest mode → redirect them to homepage restricted notice
      window.location.href = "index.html#restrictedAccess";
      return;
    }
  } catch {
    window.location.href = "index.html#restrictedAccess";
    return;
  }

  // ============================
  // CATEGORY FILTERING
  // ============================
  const filterButtons = document.querySelectorAll(".filter-btn");
  const serviceCards = document.querySelectorAll(".service-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
          // Special height rules for facility slider
      const facilitySlider = document.querySelector('.facility-slider');

      if (facilitySlider) {
        if (filter === "facilities") {
          facilitySlider.classList.add('large-slider');
        } else {
          facilitySlider.classList.remove('large-slider');
        }
      }
            // Special height rules for Columbarium image
      const columbariumImg = document.querySelector('.columbarium-img');

      if (columbariumImg) {
        if (filter === "columbarium") {
          columbariumImg.classList.add("large-columbarium");
        } else {
          columbariumImg.classList.remove("large-columbarium");
        }
      }
      // Columbarium slider special height
      const colSlider = document.querySelector('.columbarium-slider');

      if (colSlider) {
        if (filter === "columbarium") {
          colSlider.classList.add("large-col");
        } else {
          colSlider.classList.remove("large-col");
        }
      }
      // Cremation Urns slider special height
      const urnSlider = document.querySelector('.urn-slider');

      if (urnSlider) {
        if (filter === "cremation") {
          urnSlider.classList.add("large-urn");
        } else {
          urnSlider.classList.remove("large-urn");
        }
      }
      // Active button state
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show / hide cards
      serviceCards.forEach((card) => {
        const categories = (card.dataset.category || "").split(" ");
        if (filter === "all" || categories.includes(filter)) {
          card.classList.remove("hidden-card");
        } else {
          card.classList.add("hidden-card");
        }
      });
    });
  });

  // ============================
  // SERVICE MODAL DATA
  // ============================
  const serviceDetails = {
    "facilities-overview": {
      title: "Sanctuary Facilities",
      price: "",
      description:
        "The Sanctuary in Heaven’s Garden brings together key spaces that support families at every stage of the memorial process, from inquiries and arrangements to viewing, cremation, and final placement.",
      inclusions: [
        "Administrative office for walk-in and scheduled inquiries",
        "Main chapel for funeral masses and memorial services",
        "Chapel family rooms for private rest and overnight stays",
        "Dedicated prayer room for quiet reflection",
        "Viewing and urn-viewing areas for intimate goodbyes",
        "Indoor columbarium with secure vaults",
        "Mortuary area for professional preparation of remains",
        "Waiting areas and view decks with serene surroundings",
        "PWD-friendly comfort rooms and easy-access pathways",
      ],
      freebies: [
        "Assistance from friendly and accommodating staff",
        "Maintained, clean, and well-ventilated facilities",
        "24-hour security and CCTV coverage in key areas",
        "Parking spaces for family and guests",
      ],
      notes:
        "Operating hours and specific access to certain facilities (e.g., chapels, viewing areas) may vary depending on scheduled services. Please coordinate with the Administrative Office for details.",
    },
    "columbarium-products": {
      title: "Columbarium Vaults",
      price: "Available in Regular and Special Cut Units",
      description:
        "The columbarium offers a respectful, indoor resting place for urns, with modern design and clear identification for each vault.",
      inclusions: [
        "Regular vault accommodating up to 4 standard-sized urns",
        "Special cut corner vault accommodating up to 8 standard-sized urns",
        "Two-sided structure with numbered rows and columns",
        "Dedicated niche for each urn with secure placement",
        "Personalized nameplate with custom message and epitaph",
      ],
      freebies: [
        "Clean, well-maintained indoor environment",
        "Modern architectural design with quiet ambiance",
        "24/7 CCTV monitoring and on-site security",
        "Access to nearby chapels and facilities",
      ],
      notes:
        "Prices, level positioning, and specific vault locations are subject to availability. Payment terms may include spot cash discounts and installment options with applicable interest rates.",
    },
    "urn-viewing": {
      title: "Urn Viewing Packages",
      price: "Chapel packages starting at ₱150,000",
      description:
        "Urn viewing packages provide a complete arrangement that combines cremation, urn, chapel viewing, and pastoral support for family and friends.",
      inclusions: [
        "Retrieval of the remains from hospital, home, or designated location",
        "Cremation service performed at The Sanctuary crematorium",
        "Standard marble urn provided for the cremated remains",
        "Four days and three nights of chapel viewing",
        "Professional urn viewing setup in chosen chapel",
        "Liturgical service at the Main Chapel for a set duration",
      ],
      freebies: [
        "Guest book and guest kit for visitors",
        "Mineral water supply and hot/cold water dispenser",
        "Coffee service for guests (approx. 100 servings)",
        "Announcement board and donation box",
        "Basic floral arrangement and simple decorative setup",
        "Access to view deck, parking, and common areas",
        "24-hour CCTV monitoring and Wi-Fi access in key areas",
      ],
      notes:
        "Package rates vary by chapel: approximately ₱150,000 for Chapel A, ₱250,000 for Chapel B, and ₱350,000 for the Main Chapel. Senior Citizen and PWD discounts apply where applicable.",
    },
    "casket-viewing": {
      title: "Casket Viewing Packages",
      price: "Chapel packages starting at ₱200,000",
      description:
        "Casket viewing packages include body preparation, casket, chapel venue, and pastoral services to provide a dignified farewell for your loved one.",
      inclusions: [
        "Retrieval of the remains from hospital, home, or designated location",
        "Professional embalming and body preparation",
        "Provision of a metal casket as part of the package",
        "Four days and three nights of chapel viewing",
        "Complete viewing setup in the selected chapel",
        "Liturgical service at the Main Chapel for a set duration",
      ],
      freebies: [
        "Guest book and guest kit for visitors",
        "Mineral water and hot/cold-water dispenser",
        "Coffee service for guests (approx. 100 servings)",
        "Announcement board and donation box",
        "Basic floral arrangement and view deck setup",
        "Tarpaulin announcement and 24-hour CCTV support",
        "Complimentary parking and Wi-Fi access in common areas",
      ],
      notes:
        "Approximate package rates: ₱200,000 for Chapel A, ₱300,000 for Chapel B, and ₱400,000 for the Main Chapel. Senior Citizen and PWD discounts may be applied according to prevailing guidelines.",
    },
    "chapel-rental": {
      title: "Chapel Rental (Viewing Only)",
      price: "Daily rental starting at ₱75,000",
      description:
        "Chapel rental is ideal for families who already have funeral arrangements but wish to hold the viewing in one of The Sanctuary’s chapels.",
      inclusions: [
        "Use of Chapel A, Chapel B, or the Main Chapel for one day",
        "Viewing setup with chairs, basic floral decorations, and lighting",
        "Access to comfort rooms and waiting areas",
        "Support from on-site staff during the rental period",
      ],
      freebies: [
        "Use of parking areas for visitors",
        "Security and CCTV in the chapel vicinity",
        "Access to available Wi-Fi in designated areas",
      ],
      notes:
        "Daily rental rates are approximately ₱75,000 for Chapel A, ₱150,000 for Chapel B, and ₱225,000 for the Main Chapel. Additional days may be arranged with corresponding extension rates.",
    },
    "cremation-services": {
      title: "Cremation Services",
      price: "Standard and direct cremation options available",
      description:
        "Cremation services are carried out with respect and care, whether as part of a viewing package or as a direct service.",
      inclusions: [
        "Standard cremation with use of crematorium facilities",
        "Direct cremation option without chapel viewing",
        "Assistance with basic documentation and coordination",
        "Use of designated waiting area during the cremation",
      ],
      freebies: [
        "Guidance from staff throughout the process",
        "Access to waiting area amenities where available",
      ],
      notes:
        "Exact rates and scheduling for cremation services will be confirmed by The Sanctuary office. Referral fees and caller’s fee guidelines may apply for authorized agents.",
    },
    "cremation-urns": {
      title: "Cremation Urns",
      price: "Urn options from approximately ₱3,500 to ₱18,000",
      description:
        "The Sanctuary offers several urn designs to suit different preferences, all suitable for columbarium placement or home keeping.",
      inclusions: [
        "Marble urn – approximate price ₱3,500",
        "Aluminum metal urn – approximate price ₱5,000",
        "Metal brass urn – approximate price ₱18,000",
      ],
      freebies: [
        "Guidance in selecting an urn appropriate for the chosen vault",
        "Basic handling and preparation of the urn for placement",
      ],
      notes:
        "Designs, colors, and availability may vary. Please confirm current stocks and exact pricing with the Administrative Office.",
    },
    "cremation-plan": {
      title: "Cremation Service Plan",
      price: "Contract value per plan: ₱21,000",
      description:
        "The Cremation Service Plan provides a pre-arranged cremation service option, giving families peace of mind and predictable costs.",
      inclusions: [
        "Cremation service plan tied to a specific columbarium unit",
        "Each plan valued at ₱21,000",
        "Available on installment basis (1-year or 2-year terms)",
        "Plan may be transferred or assigned under set guidelines",
        "Up to four plans per qualified unit owner",
      ],
      freebies: [
        "Flexible payment arrangements within the agreed term",
        "Guidance from staff in documenting and updating plan details",
      ],
      notes:
        "In case of significant increases in service-related costs, a corresponding price differential may be applied. All terms and conditions will be explained in the official contract.",
    },
    "funeral-referral": {
      title: "Funeral Service Referral",
      price: "Referral fee structure based on package value",
      description:
        "The Sanctuary coordinates with funeral service providers and offers referral arrangements for complete funeral packages.",
      inclusions: [
        "Referral to trusted funeral service partners",
        "Guidance in understanding package components and pricing",
        "Support in coordinating with the provider as needed",
      ],
      freebies: [
        "Clear referral fee guidelines for transparency",
        "Processing of referral fees through the main office when required",
      ],
      notes:
        "Referral fee is typically a percentage of the package value, with processing timelines depending on whether payment is made in cash, check, or bank transfer.",
    },
  };

  // ============================
  // MODAL LOGIC
  // ============================
  const modal = document.getElementById("serviceModal");
  const modalBackdrop = modal?.querySelector(".service-modal-backdrop");
  const modalCloseButtons = modal?.querySelectorAll(".modal-close");
  const modalTitle = modal?.querySelector("#modalTitle");
  const modalPrice = modal?.querySelector("#modalPrice");
  const modalDescription = modal?.querySelector("#modalDescription");
  const modalInclusions = modal?.querySelector("#modalInclusions");
  const modalFreebies = modal?.querySelector("#modalFreebies");
  const modalNotes = modal?.querySelector("#modalNotes");
  const modalInquireBtn = modal?.querySelector("#modalInquireBtn");

  function openServiceModal(serviceId) {
    if (!modal || !serviceDetails[serviceId]) return;

    const data = serviceDetails[serviceId];

    modalTitle.textContent = data.title || "";
    modalPrice.textContent = data.price || "";
    modalDescription.textContent = data.description || "";

    // Clear lists first
    modalInclusions.innerHTML = "";
    modalFreebies.innerHTML = "";

    (data.inclusions || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      modalInclusions.appendChild(li);
    });

    (data.freebies || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      modalFreebies.appendChild(li);
    });

    modalNotes.textContent = data.notes || "";

    // Optional: include service id in query string for inquiry page
    if (modalInquireBtn) {
      const url = new URL(window.location.origin + "/inquiry.html");
      url.searchParams.set("service", data.title || serviceId);
      modalInquireBtn.href = url.toString();
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeServiceModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // Attach to all "View Details" buttons
  const detailButtons = document.querySelectorAll(".view-details-btn");
  detailButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.serviceId;
      if (id) openServiceModal(id);
    });
  });

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", closeServiceModal);
  }

  if (modalCloseButtons) {
    modalCloseButtons.forEach((btn) => {
      btn.addEventListener("click", closeServiceModal);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeServiceModal();
    }
  });

  // ============================
  // COMPARISON TABS
  // ============================
  const comparisonTabs = document.querySelectorAll(".comparison-tab");
  const comparisonTables = document.querySelectorAll(".comparison-table");

  comparisonTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.target;

      comparisonTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      comparisonTables.forEach((table) => {
        if (table.id === targetId) {
          table.classList.add("active");
        } else {
          table.classList.remove("active");
        }
      });
    });
  });

  // ============================
  // CREMATION PLAN CALCULATOR
  // ============================
  const planForm = document.getElementById("planCalculatorForm");
  const planCountInput = document.getElementById("planCount");
  const planTermSelect = document.getElementById("planTerm");
  const planResult = document.getElementById("planResult");

  if (planForm && planCountInput && planTermSelect && planResult) {
    planForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const plans = Math.max(1, Math.min(4, Number(planCountInput.value) || 1));
      const selectedOption = planTermSelect.selectedOptions[0];

      const months = Number(selectedOption.dataset.months || 0);
      const monthly = Number(selectedOption.dataset.monthly || 0);
      const totalMonthly = monthly * plans;
      const totalPayable = totalMonthly * months;

      const termLabel =
        planTermSelect.value === "1year" ? "1-year term" : "2-year term";

      planResult.innerHTML = `
        <p><strong>Selected:</strong> ${plans} plan(s) on a ${termLabel}.</p>
        <p><strong>Estimated monthly payment:</strong> ₱${totalMonthly.toLocaleString()}</p>
        <p><strong>Estimated total amount over ${months} month(s):</strong> ₱${totalPayable.toLocaleString()}</p>
        <p class="calculator-note">
          This is a guide computation based on current sample figures (₱21,000 per plan).
          Final pricing, discounts, and terms will be confirmed by The Sanctuary office.
        </p>
      `;
    });
  }
/* ============================= */
/* IMAGE SLIDER (FACILITY CARD)  */
/* ============================= */

function initSlider(sliderName) {
  const slider = document.querySelector(`.facility-slider[data-slider="${sliderName}"]`);
  if (!slider) return;

  const slides = slider.querySelectorAll(".slide");
  const leftArrow = slider.querySelector(".left-arrow");
  const rightArrow = slider.querySelector(".right-arrow");
  const dotsContainer = slider.querySelector(".slider-dots");

  let index = 0;

  // Create dots dynamically
  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll(".dot");

  function goToSlide(i) {
    slides[index].classList.remove("active");
    dots[index].classList.remove("active");
    index = i;
    slides[index].classList.add("active");
    dots[index].classList.add("active");
  }

  function nextSlide() {
    let next = index + 1;
    if (next >= slides.length) next = 0;
    goToSlide(next);
  }

  function prevSlide() {
    let prev = index - 1;
    if (prev < 0) prev = slides.length - 1;
    goToSlide(prev);
  }

  rightArrow.addEventListener("click", nextSlide);
  leftArrow.addEventListener("click", prevSlide);

  // Optional auto-slide every 6 seconds
  setInterval(nextSlide, 6000);
}

// Initialize the Sanctuary Facilities slider
initSlider("facilities");
/* ============================= */
/* COLUMBARIUM SLIDER            */
/* ============================= */

function initColumbariumSlider() {
  const slider = document.querySelector(`.columbarium-slider[data-slider="columbarium"]`);
  if (!slider) return;

  const slides = slider.querySelectorAll(".col-slide");
  const leftArrow = slider.querySelector(".left-arrow");
  const rightArrow = slider.querySelector(".right-arrow");
  const dotsContainer = slider.querySelector(".slider-dots");

  let index = 0;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll(".dot");

  function goToSlide(i) {
    slides[index].classList.remove("active");
    dots[index].classList.remove("active");

    index = i;

    slides[index].classList.add("active");
    dots[index].classList.add("active");
  }

  function nextSlide() {
    let next = index + 1;
    if (next >= slides.length) next = 0;
    goToSlide(next);
  }

  function prevSlide() {
    let prev = index - 1;
    if (prev < 0) prev = slides.length - 1;
    goToSlide(prev);
  }

  rightArrow.addEventListener("click", nextSlide);
  leftArrow.addEventListener("click", prevSlide);

  // Optional auto-slide
  setInterval(nextSlide, 7000);
}

initColumbariumSlider();
/* ============================= */
/* CREMATION URNS SLIDER         */
/* ============================= */

function initUrnSlider() {
  const slider = document.querySelector('.urn-slider[data-slider="urns"]');
  if (!slider) return;

  const slides = slider.querySelectorAll(".urn-slide");
  const leftArrow = slider.querySelector(".left-arrow");
  const rightArrow = slider.querySelector(".right-arrow");
  const dotsContainer = slider.querySelector(".slider-dots");

  let index = 0;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll(".dot");

  function goToSlide(i) {
    slides[index].classList.remove("active");
    dots[index].classList.remove("active");

    index = i;

    slides[index].classList.add("active");
    dots[index].classList.add("active");
  }

  function nextSlide() {
    let next = index + 1;
    if (next >= slides.length) next = 0;
    goToSlide(next);
  }

  function prevSlide() {
    let prev = index - 1;
    if (prev < 0) prev = slides.length - 1;
    goToSlide(prev);
  }

  rightArrow.addEventListener("click", nextSlide);
  leftArrow.addEventListener("click", prevSlide);

  // Optional auto-slide
  setInterval(nextSlide, 6000);
}

initUrnSlider();
});
